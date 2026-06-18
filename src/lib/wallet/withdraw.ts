import { Prisma } from '@prisma/client'
import type { Prisma as PrismaNamespace } from '@prisma/client'
import type { WalletWithdrawRequest } from '@prisma/client'
import { prisma } from '@/lib/db'
import { walletTransaction } from '@/lib/wallet/transaction'
import { assertDailyLimitInTx } from '@/lib/wallet/policy'
import { assessWithdrawRisk, createSecurityAlert } from '@/lib/wallet/security-scan'

const REJECT_CONFIRM_WINDOW_MS = 15 * 60 * 1000
const SLA_HOURS = 24

export class WithdrawError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'WithdrawError'
  }
}

type TxClient = PrismaNamespace.TransactionClient

async function holdForWithdraw(
  tx: TxClient,
  userId: string,
  amount: PrismaNamespace.Decimal,
  withdrawId: string,
  description: string,
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new WithdrawError('Wallet tidak ditemukan', 'WALLET_NOT_FOUND')
  if (wallet.balance.lessThan(amount)) {
    throw new WithdrawError('Saldo tidak cukup', 'INSUFFICIENT_BALANCE')
  }

  const newBalance = wallet.balance.sub(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  return tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'ESCROW_HOLD',
      amount: amount.neg(),
      balance: newBalance,
      description,
      referenceId: withdrawId,
    },
  })
}

async function refundWithdrawHold(
  tx: TxClient,
  userId: string,
  amount: PrismaNamespace.Decimal,
  withdrawId: string,
  description: string,
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new WithdrawError('Wallet tidak ditemukan', 'WALLET_NOT_FOUND')

  const newBalance = wallet.balance.add(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  return tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'REFUND',
      amount,
      balance: newBalance,
      description,
      referenceId: withdrawId,
    },
  })
}

async function finalizeWithdrawLedger(
  tx: TxClient,
  userId: string,
  withdrawId: string,
  description: string,
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new WithdrawError('Wallet tidak ditemukan', 'WALLET_NOT_FOUND')

  return tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'WITHDRAWAL',
      amount: new Prisma.Decimal(0),
      balance: wallet.balance,
      description,
      referenceId: withdrawId,
    },
  })
}

export async function createWithdrawRequest(input: {
  userId: string
  amount: number
  bankName: string
  accountNumber: string
  accountHolder: string
  note?: string
}) {
  const amountDec = new Prisma.Decimal(input.amount)
  const slaDueAt = new Date(Date.now() + SLA_HOURS * 60 * 60 * 1000)
  const description = `Hold penarikan ke ${input.bankName} ${input.accountNumber}`

  const request = await walletTransaction(async (tx) => {
    await assertDailyLimitInTx(tx, {
      userId: input.userId,
      kind: 'WITHDRAW',
      amount: amountDec,
    })

    const row = await tx.walletWithdrawRequest.create({
      data: {
        userId: input.userId,
        amount: amountDec,
        bankName: input.bankName.trim(),
        accountNumber: input.accountNumber.trim(),
        accountHolder: input.accountHolder.trim(),
        note: input.note?.trim() || null,
        status: 'PENDING',
        slaDueAt,
      },
    })

    const holdLedger = await holdForWithdraw(
      tx,
      input.userId,
      amountDec,
      row.id,
      description,
    )

    return tx.walletWithdrawRequest.update({
      where: { id: row.id },
      data: { ledgerHoldId: holdLedger.id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })
  })

  const wallet = await prisma.wallet.findUnique({ where: { userId: input.userId } })
  if (wallet) {
    const risk = await assessWithdrawRisk({
      userId: input.userId,
      walletId: wallet.id,
      amount: input.amount,
    })
    const updated = await prisma.walletWithdrawRequest.update({
      where: { id: request.id },
      data: { riskScore: risk.riskScore, riskFlags: risk.riskFlags },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })

    if (risk.riskScore >= 61) {
      await createSecurityAlert({
        userId: input.userId,
        walletId: wallet.id,
        ruleCode: 'HIGH_RISK_WITHDRAW',
        severity: 'CRITICAL',
        title: 'Penarikan berisiko tinggi',
        body: `Pengajuan penarikan Rp ${input.amount.toLocaleString('id-ID')} — skor risiko ${risk.riskScore}. Flags: ${risk.riskFlags.join(', ')}`,
        withdrawRequestId: request.id,
        metadata: { riskFlags: risk.riskFlags, riskScore: risk.riskScore },
      })
    }

    return updated
  }

  return request
}

const HIGH_RISK_WITHDRAW_THRESHOLD = 61

export async function completeWithdrawRequest(
  requestId: string,
  adminId: string,
  opts: { proofUrl?: string; adminNote?: string },
) {
  const existing = await prisma.walletWithdrawRequest.findUnique({ where: { id: requestId } })
  if (!existing) throw new WithdrawError('Permintaan tidak ditemukan', 'NOT_FOUND')
  if (existing.status !== 'PENDING') {
    throw new WithdrawError('Status permintaan tidak valid', 'INVALID_STATUS')
  }

  if (existing.riskScore >= HIGH_RISK_WITHDRAW_THRESHOLD) {
    const openAlert = await prisma.walletSecurityAlert.findFirst({
      where: {
        withdrawRequestId: requestId,
        ruleCode: 'HIGH_RISK_WITHDRAW',
        status: 'OPEN',
      },
    })
    if (openAlert) {
      throw new WithdrawError(
        'Penarikan berisiko tinggi. Tinjau dan tutup alert keamanan terlebih dahulu di Saldo → Keamanan.',
        'HIGH_RISK_REVIEW_REQUIRED',
      )
    }
  }

  const description = `Penarikan selesai (hold #${requestId.slice(-8)})`

  return walletTransaction(async (tx) => {
    const finalLedger = await finalizeWithdrawLedger(
      tx,
      existing.userId,
      requestId,
      description,
    )

    return tx.walletWithdrawRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        processedById: adminId,
        proofUrl: opts.proofUrl?.trim() || null,
        adminNote: opts.adminNote?.trim() || null,
        ledgerFinalId: finalLedger.id,
        completedAt: new Date(),
      },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })
  })
}

export async function rejectWithdrawInit(
  requestId: string,
  adminId: string,
  rejectionNote: string,
) {
  const existing = await prisma.walletWithdrawRequest.findUnique({ where: { id: requestId } })
  if (!existing) throw new WithdrawError('Permintaan tidak ditemukan', 'NOT_FOUND')
  if (existing.status !== 'PENDING') {
    throw new WithdrawError('Status permintaan tidak valid', 'INVALID_STATUS')
  }

  return prisma.walletWithdrawRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECT_PENDING_RELEASE',
      rejectedById: adminId,
      rejectionNote: rejectionNote.trim(),
      rejectInitiatedAt: new Date(),
    },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  })
}

export async function rejectWithdrawConfirmRelease(requestId: string, adminId: string) {
  const existing = await prisma.walletWithdrawRequest.findUnique({ where: { id: requestId } })
  if (!existing) throw new WithdrawError('Permintaan tidak ditemukan', 'NOT_FOUND')
  if (existing.status !== 'REJECT_PENDING_RELEASE') {
    throw new WithdrawError('Status permintaan tidak valid', 'INVALID_STATUS')
  }
  if (!existing.rejectInitiatedAt) {
    throw new WithdrawError('Penolakan belum diinisiasi', 'INVALID_STATE')
  }
  if (Date.now() - existing.rejectInitiatedAt.getTime() > REJECT_CONFIRM_WINDOW_MS) {
    throw new WithdrawError('Konfirmasi penolakan kedaluwarsa, ulangi dari awal', 'EXPIRED')
  }
  if (existing.ledgerReleaseId) {
    return prisma.walletWithdrawRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })
  }

  const amountDec = existing.amount
  const description = `Pembatalan penarikan #${requestId.slice(-8)}`

  return walletTransaction(async (tx) => {
    const claimed = await tx.walletWithdrawRequest.updateMany({
      where: {
        id: requestId,
        status: 'REJECT_PENDING_RELEASE',
        ledgerReleaseId: null,
      },
      data: { releaseConfirmedById: adminId },
    })
    if (claimed.count !== 1) {
      const current = await tx.walletWithdrawRequest.findUnique({
        where: { id: requestId },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      })
      if (current?.ledgerReleaseId) return current
      throw new WithdrawError('Konfirmasi penolakan sedang diproses', 'CONCURRENT_RELEASE')
    }

    const priorRefund = await tx.walletLedger.findFirst({
      where: { referenceId: requestId, type: 'REFUND' },
    })
    if (priorRefund) {
      return tx.walletWithdrawRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          ledgerReleaseId: priorRefund.id,
          releaseConfirmedById: adminId,
        },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      })
    }

    const releaseLedger = await refundWithdrawHold(
      tx,
      existing.userId,
      amountDec,
      requestId,
      description,
    )

    return tx.walletWithdrawRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        ledgerReleaseId: releaseLedger.id,
      },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })
  })
}

export async function rejectWithdrawCancel(requestId: string) {
  const existing = await prisma.walletWithdrawRequest.findUnique({ where: { id: requestId } })
  if (!existing) throw new WithdrawError('Permintaan tidak ditemukan', 'NOT_FOUND')
  if (existing.status !== 'REJECT_PENDING_RELEASE') {
    throw new WithdrawError('Status permintaan tidak valid', 'INVALID_STATUS')
  }

  return prisma.walletWithdrawRequest.update({
    where: { id: requestId },
    data: {
      status: 'PENDING',
      rejectedById: null,
      rejectionNote: null,
      rejectInitiatedAt: null,
    },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  })
}

export function serializeWithdrawRequest(row: WalletWithdrawRequest & {
  user: { id: string; name: string; email: string; role: string }
}) {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.user.name,
    userEmail: row.user.email,
    userRole: row.user.role,
    amount: row.amount.toString(),
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    accountHolder: row.accountHolder,
    note: row.note,
    status: row.status,
    riskScore: row.riskScore,
    riskFlags: (row.riskFlags as string[] | null) ?? [],
    proofUrl: row.proofUrl,
    adminNote: row.adminNote,
    rejectionNote: row.rejectionNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    slaDueAt: row.slaDueAt.toISOString(),
    rejectInitiatedAt: row.rejectInitiatedAt?.toISOString() ?? null,
  }
}
