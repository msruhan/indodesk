import type { Prisma } from '@prisma/client'
import { Prisma as PrismaNamespace } from '@prisma/client'

type TxClient = Prisma.TransactionClient

export async function debitUserForTopup(
  tx: TxClient,
  userId: string,
  amount: PrismaNamespace.Decimal,
  orderId: string,
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
      referenceId: orderId,
    },
  })
}
