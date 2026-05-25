/**
 * Stress Test Seed
 *
 * Membuat data test dengan email pattern `*@indoteknizi.test` yang mudah
 * dibersihkan. TIDAK menghapus data existing — append-only via upsert.
 *
 * Usage: npm run stress:seed
 */

import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hash } from 'bcryptjs'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const STRESS_PASSWORD = 'StressTest123!'
const USER_COUNT = 30
const TEKNISI_COUNT = 20
const TEKNISI_WITH_TELEGRAM = 5
const STARTING_BALANCE = 5_000_000
const STRESS_PRODUCT_COUNT = 30
const STRESS_PRODUCT_STOCK = 9999
const STRESS_PRODUCT_PREFIX = '[STRESS]'

async function main() {
  console.log('🌱 Stress test seed starting...')
  const passwordHash = await hash(STRESS_PASSWORD, 12)

  // ---- USERS ----
  console.log(`Creating ${USER_COUNT} stress users...`)
  for (let i = 1; i <= USER_COUNT; i++) {
    const email = `stress-user-${i}@indoteknizi.test`
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Stress User ${i}`,
        password: passwordHash,
        role: UserRole.USER,
        phone: `+62 800-0000-${String(i).padStart(4, '0')}`,
      },
    })

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: { balance: STARTING_BALANCE },
      create: { userId: user.id, balance: STARTING_BALANCE },
    })
  }

  // ---- TEKNISI ----
  console.log(`Creating ${TEKNISI_COUNT} stress teknisi...`)
  for (let i = 1; i <= TEKNISI_COUNT; i++) {
    const email = `stress-teknisi-${i}@indoteknizi.test`
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Stress Teknisi ${i}`,
        password: passwordHash,
        role: UserRole.TEKNISI,
        phone: `+62 801-0000-${String(i).padStart(4, '0')}`,
      },
    })

    const isLinkedTelegram = i <= TEKNISI_WITH_TELEGRAM
    await prisma.teknisiProfile.upsert({
      where: { userId: user.id },
      update: {
        verificationStatus: 'APPROVED',
        telegramChatId: isLinkedTelegram ? `99900000${i}` : null,
        telegramUsername: isLinkedTelegram ? `stress_teknisi_${i}` : null,
        telegramLinkedAt: isLinkedTelegram ? new Date() : null,
      },
      create: {
        userId: user.id,
        verificationStatus: 'APPROVED',
        telegramChatId: isLinkedTelegram ? `99900000${i}` : null,
        telegramUsername: isLinkedTelegram ? `stress_teknisi_${i}` : null,
        telegramLinkedAt: isLinkedTelegram ? new Date() : null,
      },
    })

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, balance: 0 },
    })
  }

  // ---- PRODUCTS ----
  // Buat produk dummy dengan stock besar di teknisi pertama (stress-teknisi-1)
  // supaya checkout tidak kena OUT_OF_STOCK saat stress test S2.
  console.log(`Creating ${STRESS_PRODUCT_COUNT} stress products...`)
  const sellerTeknisi = await prisma.user.findFirst({
    where: { email: 'stress-teknisi-1@indoteknizi.test' },
    select: { id: true },
  })
  if (sellerTeknisi) {
    for (let i = 1; i <= STRESS_PRODUCT_COUNT; i++) {
      const productName = `${STRESS_PRODUCT_PREFIX} Test Product ${i}`
      const existing = await prisma.product.findFirst({
        where: { name: productName, sellerId: sellerTeknisi.id },
        select: { id: true },
      })
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            stock: STRESS_PRODUCT_STOCK,
            isPublished: true,
            isActive: true,
            listingStatus: 'APPROVED',
          },
        })
      } else {
        await prisma.product.create({
          data: {
            sellerId: sellerTeknisi.id,
            name: productName,
            category: 'AKSESORIS',
            price: 50_000 + i * 1_000,
            description: 'Stress test product — abaikan saat browse manual.',
            stock: STRESS_PRODUCT_STOCK,
            isPublished: true,
            isActive: true,
            listingStatus: 'APPROVED',
          },
        })
      }
    }
  } else {
    console.warn('   ⚠️  stress-teknisi-1 not found, skipping product seed')
  }

  console.log('✅ Stress test seed complete')
  console.log(`   Users:    ${USER_COUNT}  (stress-user-1..${USER_COUNT}@indoteknizi.test)`)
  console.log(`   Teknisi:  ${TEKNISI_COUNT}  (stress-teknisi-1..${TEKNISI_COUNT}@indoteknizi.test)`)
  console.log(`   Products: ${STRESS_PRODUCT_COUNT}  (stock ${STRESS_PRODUCT_STOCK} each, sold by stress-teknisi-1)`)
  console.log(`   With Telegram: ${TEKNISI_WITH_TELEGRAM}`)
  console.log(`   Password (semua): ${STRESS_PASSWORD}`)
  console.log(`   Wallet user: Rp ${STARTING_BALANCE.toLocaleString('id-ID')}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
