import type { Prisma } from '@prisma/client'
import { Prisma as PrismaNamespace } from '@prisma/client'

type TxClient = Prisma.TransactionClient

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
