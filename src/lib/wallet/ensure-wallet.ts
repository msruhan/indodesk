import type { Wallet } from '@prisma/client'
import { prisma } from '@/lib/db'

/** Pastikan wallet ada — sama seperti GET /api/wallet. */
export async function ensureUserWallet(userId: string): Promise<Wallet> {
  return prisma.wallet.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {},
  })
}
