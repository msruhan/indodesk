import { Prisma } from '@prisma/client'
import type { Prisma as PrismaNamespace } from '@prisma/client'
import { prisma } from '@/lib/db'

/** Serializable isolation for wallet / ledger operations (R3.1). */
export const WALLET_TX_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 5000,
  timeout: 10_000,
} as const

export function walletTransaction<T>(
  fn: (tx: PrismaNamespace.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(fn, WALLET_TX_OPTIONS)
}
