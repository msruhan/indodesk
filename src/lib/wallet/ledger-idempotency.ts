import type { LedgerType, Prisma } from '@prisma/client'

type TxClient = Prisma.TransactionClient

/** Cek apakah entri ledger sudah ada untuk kombinasi wallet + type + referensi. */
export async function hasWalletLedgerEntry(
  tx: TxClient,
  walletId: string,
  type: LedgerType,
  referenceId: string,
): Promise<boolean> {
  const row = await tx.walletLedger.findFirst({
    where: { walletId, type, referenceId },
    select: { id: true },
  })
  return Boolean(row)
}

export async function hasWalletLedgerByUser(
  tx: TxClient,
  userId: string,
  type: LedgerType,
  referenceId: string,
): Promise<boolean> {
  const row = await tx.walletLedger.findFirst({
    where: { type, referenceId, wallet: { userId } },
    select: { id: true },
  })
  return Boolean(row)
}
