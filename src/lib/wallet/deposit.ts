import { Prisma } from '@prisma/client'
import type { Prisma as PrismaNamespace } from '@prisma/client'
import { walletTransaction } from '@/lib/wallet/transaction'

export type ExecuteDepositInput = {
  userId: string
  amount: number
  description: string
  referenceId?: string | null
  ledgerType?: 'TOPUP'
}

export async function executeWalletDepositInTx(
  tx: PrismaNamespace.TransactionClient,
  input: ExecuteDepositInput,
) {
  if (input.referenceId) {
    const existing = await tx.walletLedger.findFirst({
      where: {
        referenceId: input.referenceId,
        type: input.ledgerType ?? 'TOPUP',
      },
    })
    if (existing) {
      const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } })
      if (!wallet) throw new Error('WALLET_NOT_FOUND')
      return { wallet, ledger: existing }
    }
  }

  const amountDec = new Prisma.Decimal(input.amount)
  let wallet = await tx.wallet.findUnique({ where: { userId: input.userId } })
  if (!wallet) {
    wallet = await tx.wallet.create({ data: { userId: input.userId, balance: 0 } })
  }
  const newBalance = wallet.balance.add(amountDec)
  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })
  const ledger = await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: input.ledgerType ?? 'TOPUP',
      amount: amountDec,
      balance: newBalance,
      description: input.description,
      referenceId: input.referenceId ?? null,
    },
  })
  return { wallet: updated, ledger }
}

export async function executeWalletDeposit(input: ExecuteDepositInput) {
  return walletTransaction((tx) => executeWalletDepositInTx(tx, input))
}

export async function executeWalletWithdraw(
  tx: PrismaNamespace.TransactionClient,
  userId: string,
  amount: number,
  description: string,
  referenceId?: string,
) {
  const amountDec = new Prisma.Decimal(amount)
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('WALLET_NOT_FOUND')
  if (wallet.balance.lessThan(amountDec)) throw new Error('INSUFFICIENT_BALANCE')

  const newBalance = wallet.balance.sub(amountDec)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })

  const ledger = await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'WITHDRAWAL',
      amount: amountDec.neg(),
      balance: newBalance,
      description,
      referenceId: referenceId ?? null,
    },
  })

  return { wallet: { ...wallet, balance: newBalance }, ledger }
}
