import { WalletDepositStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { executeWalletDepositInTx } from '@/lib/wallet/deposit'
import { walletTransaction } from '@/lib/wallet/transaction'

export class DualControlError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'DualControlError'
  }
}

export function getDualControlThreshold(): number {
  return Number(process.env.WALLET_DUAL_CONTROL_THRESHOLD ?? 5_000_000)
}

export function requiresDualControl(amount: number): boolean {
  return amount > getDualControlThreshold()
}

export async function createPendingDepositRequest(input: {
  userId: string
  amount: number
  note: string
  reasonCategory?: string
  method: string
  reference?: string
  requestedById: string
}) {
  return prisma.walletDepositRequest.create({
    data: {
      userId: input.userId,
      amount: input.amount,
      note: input.note,
      reasonCategory: input.reasonCategory ?? null,
      method: input.method,
      reference: input.reference ?? null,
      requestedById: input.requestedById,
      status: WalletDepositStatus.PENDING_APPROVAL,
    },
  })
}

export async function approveDepositRequest(depositId: string, adminId: string) {
  const row = await prisma.walletDepositRequest.findUnique({ where: { id: depositId } })
  if (!row) throw new DualControlError('Permintaan deposit tidak ditemukan', 'NOT_FOUND')
  if (row.status === WalletDepositStatus.REJECTED) {
    throw new DualControlError('Deposit sudah ditolak', 'ALREADY_REJECTED')
  }
  if (row.status === WalletDepositStatus.APPROVED) {
    throw new DualControlError('Deposit sudah disetujui', 'ALREADY_APPROVED')
  }
  if (row.requestedById === adminId) {
    throw new DualControlError('Approver tidak boleh sama dengan pemohon', 'DUAL_CONTROL_SAME_ADMIN')
  }

  const amount = Number(row.amount)

  if (row.status === WalletDepositStatus.PENDING_APPROVAL) {
    if (row.firstApproverId === adminId) {
      throw new DualControlError('Anda sudah menyetujui tahap pertama', 'DUAL_CONTROL_SAME_ADMIN')
    }
    return prisma.walletDepositRequest.update({
      where: { id: depositId },
      data: {
        status: WalletDepositStatus.APPROVED_BY_ONE,
        firstApproverId: adminId,
      },
    })
  }

  if (row.status === WalletDepositStatus.APPROVED_BY_ONE) {
    if (row.firstApproverId === adminId) {
      throw new DualControlError('Approver kedua harus admin berbeda', 'DUAL_CONTROL_SAME_ADMIN')
    }
    if (row.ledgerId) {
      return prisma.walletDepositRequest.findUniqueOrThrow({ where: { id: depositId } })
    }

    const description = `Deposit manual (dual-control): ${row.note}`

    return walletTransaction(async (tx) => {
      const claimed = await tx.walletDepositRequest.updateMany({
        where: {
          id: depositId,
          status: WalletDepositStatus.APPROVED_BY_ONE,
          ledgerId: null,
          firstApproverId: { not: adminId },
        },
        data: { secondApproverId: adminId },
      })
      if (claimed.count !== 1) {
        const current = await tx.walletDepositRequest.findUnique({ where: { id: depositId } })
        if (current?.ledgerId) return current
        throw new DualControlError('Deposit sedang diproses admin lain', 'CONCURRENT_APPROVE')
      }

      const result = await executeWalletDepositInTx(tx, {
        userId: row.userId,
        amount,
        description,
        referenceId: row.id,
      })

      return tx.walletDepositRequest.update({
        where: { id: depositId },
        data: {
          status: WalletDepositStatus.APPROVED,
          ledgerId: result.ledger.id,
        },
      })
    })
  }

  throw new DualControlError('Status deposit tidak valid', 'INVALID_STATUS')
}

export async function rejectDepositRequest(
  depositId: string,
  adminId: string,
  rejectionNote: string,
) {
  const row = await prisma.walletDepositRequest.findUnique({ where: { id: depositId } })
  if (!row) throw new DualControlError('Permintaan deposit tidak ditemukan', 'NOT_FOUND')
  if (row.status === WalletDepositStatus.APPROVED) {
    throw new DualControlError('Deposit sudah disetujui', 'ALREADY_APPROVED')
  }

  return prisma.walletDepositRequest.update({
    where: { id: depositId },
    data: {
      status: WalletDepositStatus.REJECTED,
      rejectedById: adminId,
      rejectionNote,
    },
  })
}

export async function listPendingDepositRequests() {
  return prisma.walletDepositRequest.findMany({
    where: {
      status: { in: [WalletDepositStatus.PENDING_APPROVAL, WalletDepositStatus.APPROVED_BY_ONE] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      targetUser: { select: { id: true, name: true, email: true, role: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  })
}
