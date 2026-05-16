import { PrismaClient, UserRole, ProductCategory, JobType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hash } from 'bcryptjs'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.walletLedger.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.rekberTransaction.deleteMany()
  await prisma.topupOrder.deleteMany()
  await prisma.konsultasiSession.deleteMany()
  await prisma.remoteSession.deleteMany()
  await prisma.lowonganApplication.deleteMany()
  await prisma.lowongan.deleteMany()
  await prisma.product.deleteMany()
  await prisma.teknisiProfile.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await hash('password123', 12)

  // ---- USERS ----
  const admin = await prisma.user.create({
    data: {
      name: 'Admin IndoTeknizi',
      email: 'admin@indoteknizi.com',
      password: passwordHash,
      role: UserRole.ADMIN,
      phone: '+62 812-0000-0001',
    },
  })

  const teknisi1 = await prisma.user.create({
    data: {
      name: 'Ahmad Hidayat',
      email: 'ahmad@indoteknizi.com',
      password: passwordHash,
      role: UserRole.TEKNISI,
      phone: '+62 812-1111-1111',
    },
  })

  const teknisi2 = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi@indoteknizi.com',
      password: passwordHash,
      role: UserRole.TEKNISI,
      phone: '+62 812-2222-2222',
    },
  })

  const user1 = await prisma.user.create({
    data: {
      name: 'Siti Nurhaliza',
      email: 'siti@gmail.com',
      password: passwordHash,
      role: UserRole.USER,
      phone: '+62 812-3333-3333',
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'Rudi Hartono',
      email: 'rudi@gmail.com',
      password: passwordHash,
      role: UserRole.USER,
      phone: '+62 812-4444-4444',
    },
  })

  const user3 = await prisma.user.create({
    data: {
      name: 'Dewi Lestari',
      email: 'dewi@gmail.com',
      password: passwordHash,
      role: UserRole.USER,
      phone: '+62 812-5555-5555',
    },
  })

  // ---- TEKNISI PROFILES ----
  await prisma.teknisiProfile.create({
    data: {
      userId: teknisi1.id,
      specialty: ['Unlock', 'Flashing', 'Root', 'Hardware Repair'],
      experience: '8 tahun',
      location: 'Jakarta Selatan',
      description: 'Teknisi handphone berpengalaman dengan spesialisasi unlock, flashing, dan root berbagai brand.',
      rating: 4.9,
      reviewCount: 234,
      totalKonsultasi: 567,
      totalView: 1234,
      responseTime: '< 5 menit',
      completionRate: 98,
      isOnline: true,
      isVerified: true,
      price: 50000,
    },
  })

  await prisma.teknisiProfile.create({
    data: {
      userId: teknisi2.id,
      specialty: ['Hardware Repair', 'Screen Replacement', 'Water Damage'],
      experience: '5 tahun',
      location: 'Jakarta Pusat',
      description: 'Spesialis perbaikan hardware handphone, screen replacement, dan water damage recovery.',
      rating: 4.7,
      reviewCount: 189,
      totalKonsultasi: 342,
      totalView: 892,
      responseTime: '< 10 menit',
      completionRate: 95,
      isOnline: true,
      isVerified: true,
      price: 75000,
    },
  })

  // ---- WALLETS ----
  await prisma.wallet.create({ data: { userId: teknisi1.id, balance: 2500000 } })
  await prisma.wallet.create({ data: { userId: teknisi2.id, balance: 1800000 } })
  await prisma.wallet.create({ data: { userId: user1.id, balance: 500000 } })
  await prisma.wallet.create({ data: { userId: user2.id, balance: 250000 } })
  await prisma.wallet.create({ data: { userId: user3.id, balance: 100000 } })

  // ---- PRODUCTS ----
  const product1 = await prisma.product.create({
    data: {
      sellerId: teknisi1.id,
      name: 'iPhone 13 Pro Max - Second',
      category: ProductCategory.HANDPHONE,
      price: 8500000,
      description: 'iPhone 13 Pro Max 256GB, kondisi 95%, fullset, garansi toko 1 bulan.',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
      rating: 4.8,
      reviewCount: 124,
      views: 2341,
      stock: 3,
    },
  })

  const product2 = await prisma.product.create({
    data: {
      sellerId: teknisi2.id,
      name: 'Samsung S21 Ultra - Refurbished',
      category: ProductCategory.HANDPHONE,
      price: 7200000,
      description: 'Samsung S21 Ultra 128GB, refurbished grade A, baterai 92%.',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
      rating: 4.6,
      reviewCount: 89,
      views: 1892,
      stock: 2,
    },
  })

  const product3 = await prisma.product.create({
    data: {
      sellerId: teknisi1.id,
      name: 'Unlock Tool Premium License',
      category: ProductCategory.SOFTWARE,
      price: 500000,
      description: 'License key unlock tool premium, support semua brand, lifetime update.',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop',
      rating: 4.7,
      reviewCount: 167,
      views: 2891,
      stock: 99,
    },
  })

  // ---- SAMPLE ORDER ----
  await prisma.order.create({
    data: {
      orderCode: 'ORD-2026-000001',
      buyerId: user1.id,
      sellerId: teknisi1.id,
      subtotal: 8500000,
      total: 8500000,
      status: 'COMPLETED',
      items: {
        create: {
          productId: product1.id,
          quantity: 1,
          price: 8500000,
        },
      },
    },
  })

  // ---- SAMPLE REKBER ----
  await prisma.rekberTransaction.create({
    data: {
      orderCode: 'RKB-2026-000001',
      buyerId: user2.id,
      sellerId: teknisi2.id,
      amount: 7200000,
      fee: 72000,
      status: 'HELD',
      description: 'Pembelian Samsung S21 Ultra via rekber',
      heldAt: new Date(),
    },
  })

  // ---- SAMPLE LOWONGAN ----
  await prisma.lowongan.create({
    data: {
      posterId: admin.id,
      title: 'Teknisi Handphone Senior',
      company: 'HandPhone Center Jakarta',
      location: 'Jakarta Selatan',
      salary: 'Rp 5.000.000 - 8.000.000',
      type: JobType.FULL_TIME,
      description: 'Mencari teknisi handphone berpengalaman minimal 3 tahun.',
      requirements: [
        'Minimal 3 tahun pengalaman',
        'Menguasai berbagai brand',
        'Memahami hardware dan software',
      ],
      skills: ['iPhone', 'Samsung', 'Hardware', 'Soldering'],
    },
  })

  console.log('✅ Seed completed!')
  console.log(`   Admin: admin@indoteknizi.com / password123`)
  console.log(`   Teknisi: ahmad@indoteknizi.com / password123`)
  console.log(`   Teknisi: budi@indoteknizi.com / password123`)
  console.log(`   User: siti@gmail.com / password123`)
  console.log(`   User: rudi@gmail.com / password123`)
  console.log(`   User: dewi@gmail.com / password123`)
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
