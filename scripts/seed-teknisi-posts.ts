/**
 * Seed contoh postingan teknisi untuk profil publik.
 *
 *   npx tsx scripts/seed-teknisi-posts.ts
 *   TEKNISI_POST_SEED_EMAIL=ahmad@indoteknizi.com npx tsx scripts/seed-teknisi-posts.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'
import { seedTeknisiPostsForEmail } from '../prisma/seed-teknisi-posts'

const email = (process.env.TEKNISI_POST_SEED_EMAIL ?? 'ahmad@indoteknizi.com').trim().toLowerCase()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log(`🌱 Seeding teknisi posts for ${email}…`)
  const count = await seedTeknisiPostsForEmail(prisma, email)
  console.log(`✅ ${count} posting dibuat untuk ${email}`)
  console.log(`   Lihat: /teknisi/<userId>?tab=postingan (buka profil publik teknisi)`)
}

main()
  .catch((e) => {
    console.error('❌ Gagal seed posting teknisi:', e)
    const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : ''
    if (code === 'P2021') {
      console.error('')
      console.error('Tabel TeknisiPost belum ada. Jalankan migrasi dulu:')
      console.error('  npx prisma migrate deploy')
      console.error('  # atau lokal: npm run db:push')
    }
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
