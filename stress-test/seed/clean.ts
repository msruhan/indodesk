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

  console.log(`✅ Deleted ${result.count} stress users (cascade incl. wallet, orders, sessions)`)
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
