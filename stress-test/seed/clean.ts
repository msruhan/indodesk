/**
 * Stress Test Cleanup
 *
 * Hapus semua user dengan email pattern `*@indoteknizi.test`.
 * Cascade delete handle relasi (Wallet, Order, dll) via Prisma onDelete: Cascade.
 *
 * Usage: npm run stress:clean
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 Stress test cleanup starting...')

  // 1. Delete orders, ledger entries, sessions yang reference stress users
  //    — harus dihapus dulu sebelum product (orderItem -> product FK)
  const stressUsers = await prisma.user.findMany({
    where: { email: { endsWith: '@indoteknizi.test' } },
    select: { id: true },
  })
  const stressUserIds = stressUsers.map((u) => u.id)

  if (stressUserIds.length > 0) {
    // Order uses buyerId/sellerId, not userId
    await prisma.orderItem.deleteMany({
      where: {
        order: {
          OR: [
            { buyerId: { in: stressUserIds } },
            { sellerId: { in: stressUserIds } },
          ],
        },
      },
    })
    await prisma.order.deleteMany({
      where: {
        OR: [
          { buyerId: { in: stressUserIds } },
          { sellerId: { in: stressUserIds } },
        ],
      },
    })
    const stressWallets = await prisma.wallet.findMany({
      where: { userId: { in: stressUserIds } },
      select: { id: true },
    })
    if (stressWallets.length > 0) {
      await prisma.walletLedger.deleteMany({
        where: { walletId: { in: stressWallets.map((w) => w.id) } },
      })
    }
    console.log(`   Deleted orders & ledger for ${stressUserIds.length} stress users`)
  }

  // 2. Delete stress products (now safe — no FK references)
  const productResult = await prisma.product.deleteMany({
    where: { name: { startsWith: '[STRESS]' } },
  })
  if (productResult.count > 0) {
    console.log(`   Deleted ${productResult.count} stress products`)
  }

  // 3. Delete stress users (cascade includes wallet, sessions, teknisiProfile)
  const before = await prisma.user.count({
    where: { email: { endsWith: '@indoteknizi.test' } },
  })
  console.log(`   Found ${before} stress users to delete`)

  if (before === 0) {
    console.log('   Nothing to delete.')
    return
  }

  const result = await prisma.user.deleteMany({
    where: { email: { endsWith: '@indoteknizi.test' } },
  })

  console.log(`✅ Deleted ${result.count} stress users (cascade incl. wallet, sessions)`)
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
