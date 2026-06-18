import type { KonsultasiPaymentMethod, LedgerType, Prisma } from '@prisma/client'
import { Prisma as PrismaNamespace } from '@prisma/client'

type TxClient = Prisma.TransactionClient

export async function holdUserForKonsultasi(
  tx: TxClient,
  userId: string,
  amount: PrismaNamespace.Decimal,
  konsultasiId: string,
  description: string,
) {
  const prior = await tx.walletLedger.findFirst({
    where: { type: 'ESCROW_HOLD', referenceId: konsultasiId, wallet: { userId } },
  })
  if (prior) return

  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('WALLET_NOT_FOUND')
  if (wallet.balance.lessThan(amount)) throw new Error('INSUFFICIENT_BALANCE')

  const newBalance = wallet.balance.sub(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'ESCROW_HOLD',
      amount: amount.neg(),
      balance: newBalance,
      description,
      referenceId: konsultasiId,
    },
  })
}

export async function releaseKonsultasiHoldToUser(
  tx: TxClient,
  userId: string,
  amount: PrismaNamespace.Decimal,
  konsultasiId: string,
  description: string,
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('WALLET_NOT_FOUND')

  const newBalance = wallet.balance.add(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'REFUND',
      amount,
      balance: newBalance,
      description,
      referenceId: konsultasiId,
    },
  })
}

/** @deprecated Legacy immediate debit — kept for refund detection on old sessions */
export async function debitUserForKonsultasi(
  tx: TxClient,
  userId: string,
  amount: PrismaNamespace.Decimal,
  konsultasiId: string,
  description: string,
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('WALLET_NOT_FOUND')
  if (wallet.balance.lessThan(amount)) throw new Error('INSUFFICIENT_BALANCE')

  const newBalance = wallet.balance.sub(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'PAYMENT',
      amount: amount.neg(),
      balance: newBalance,
      description,
      referenceId: konsultasiId,
    },
  })
}

export async function refundUserForKonsultasi(
  tx: TxClient,
  userId: string,
  amount: PrismaNamespace.Decimal,
  konsultasiId: string,
  description: string,
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('WALLET_NOT_FOUND')

  const newBalance = wallet.balance.add(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'REFUND',
      amount,
      balance: newBalance,
      description,
      referenceId: konsultasiId,
    },
  })
}

export async function creditTeknisiForKonsultasi(
  tx: TxClient,
  teknisiId: string,
  amount: PrismaNamespace.Decimal,
  konsultasiId: string,
  description: string,
) {
  const wallet = await tx.wallet.findUnique({ where: { userId: teknisiId } })
  if (!wallet) throw new Error('TEKNISI_WALLET_NOT_FOUND')

  const newBalance = wallet.balance.add(amount)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'EARNING',
      amount,
      balance: newBalance,
      description,
      referenceId: konsultasiId,
    },
  })
}

async function hasLedger(
  tx: TxClient,
  konsultasiId: string,
  type: LedgerType,
  walletUserId?: string,
) {
  return tx.walletLedger.findFirst({
    where: {
      type,
      referenceId: konsultasiId,
      ...(walletUserId ? { wallet: { userId: walletUserId } } : {}),
    },
  })
}

export async function finalizeKonsultasiPaymentToTeknisi(
  tx: TxClient,
  teknisiId: string,
  userId: string,
  amount: PrismaNamespace.Decimal,
  konsultasiId: string,
  serviceLabel: string,
  paymentMethod: KonsultasiPaymentMethod | null,
) {
  const alreadyCredited = await hasLedger(tx, konsultasiId, 'EARNING', teknisiId)
  if (alreadyCredited) return

  await creditTeknisiForKonsultasi(
    tx,
    teknisiId,
    amount,
    konsultasiId,
    `Pendapatan konsultasi: ${serviceLabel}`,
  )

  if (paymentMethod === 'WALLET_HOLD') {
    await tx.konsultasiSession.update({
      where: { id: konsultasiId },
      data: { paymentStatus: 'CAPTURED' },
    })
  }
}

export async function refundKonsultasiPayment(
  tx: TxClient,
  userId: string,
  amount: PrismaNamespace.Decimal,
  konsultasiId: string,
  serviceLabel: string,
  paymentMethod: KonsultasiPaymentMethod | null,
  paymentStatus: string,
) {
  const alreadyRefunded = await hasLedger(tx, konsultasiId, 'REFUND', userId)
  if (alreadyRefunded) return

  const desc = `Refund konsultasi dibatalkan: ${serviceLabel}`

  if (paymentMethod === 'WALLET_HOLD' || paymentStatus === 'HELD' || paymentStatus === 'SECURED') {
    const hold = await hasLedger(tx, konsultasiId, 'ESCROW_HOLD', userId)
    if (hold) {
      await releaseKonsultasiHoldToUser(tx, userId, amount, konsultasiId, desc)
      await tx.konsultasiSession.update({
        where: { id: konsultasiId },
        data: { paymentStatus: 'RELEASED' },
      })
      return
    }
  }

  if (paymentMethod === 'LEGACY_DEBIT') {
    const legacyPayment = await hasLedger(tx, konsultasiId, 'PAYMENT', userId)
    if (legacyPayment) {
      await refundUserForKonsultasi(tx, userId, amount, konsultasiId, desc)
      return
    }
  }

  if (paymentMethod === 'PAYMENT_GATEWAY' && (paymentStatus === 'PAID' || paymentStatus === 'SECURED')) {
    await refundUserForKonsultasi(tx, userId, amount, konsultasiId, `${desc} (PG stub credit)`)
    await tx.konsultasiSession.update({
      where: { id: konsultasiId },
      data: { paymentStatus: 'RELEASED' },
    })
    return
  }

  const legacyPayment = await hasLedger(tx, konsultasiId, 'PAYMENT', userId)
  if (legacyPayment) {
    await refundUserForKonsultasi(tx, userId, amount, konsultasiId, desc)
  }
}
