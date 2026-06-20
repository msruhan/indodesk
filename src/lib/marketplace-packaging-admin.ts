import { prisma } from '@/lib/db'

export async function countPendingMarketplacePackagingProofs(): Promise<number> {
  return prisma.orderPackagingProof.count({ where: { status: 'PENDING' } })
}
