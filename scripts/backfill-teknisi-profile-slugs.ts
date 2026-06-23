import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { allocateTeknisiProfileSlug } from '../src/lib/teknisi-profile-slug-server'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL belum diset. Pastikan .env.local atau .env ada.')
  }

  const rows = await prisma.teknisiProfile.findMany({
    where: { profileSlug: null },
    select: { userId: true, user: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  })

  if (rows.length === 0) {
    console.log('Semua teknisi sudah punya profileSlug.')
    return
  }

  console.log(`Backfill profileSlug untuk ${rows.length} teknisi…`)

  for (const row of rows) {
    const profileSlug = await allocateTeknisiProfileSlug(row.user.name, row.userId, prisma)
    await prisma.teknisiProfile.update({
      where: { userId: row.userId },
      data: { profileSlug },
    })
    console.log(`  ${row.user.name} → /teknisi/${profileSlug}`)
  }

  console.log('Selesai.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
