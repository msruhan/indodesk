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

  // Clean existing data (child tables first — respect FK order)
  await prisma.serverOrder.deleteMany()
  await prisma.imeiOrder.deleteMany()
  await prisma.serverService.deleteMany()
  await prisma.imeiService.deleteMany()
  await prisma.serverServiceBox.deleteMany()
  await prisma.imeiServiceGroup.deleteMany()
  await prisma.imeiApi.deleteMany()
  await prisma.walletLedger.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.rekberTransaction.deleteMany()
  await prisma.topupOrder.deleteMany()
  await prisma.indodeskDownload.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.chatConversation.deleteMany()
  await prisma.teknisiStore.deleteMany()
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

  // ---- TEKNISI STORES ----
  await prisma.teknisiStore.create({
    data: {
      userId: teknisi1.id,
      name: 'HandPhone Center Jakarta',
      city: 'Jakarta',
      address: 'Jl. Thamrin No. 123, Jakarta',
      phone: '0812-3456-7890',
      email: 'info@handphonecenter.id',
      jamWeekdays: '09:00 – 21:00',
      jamWeekend: '10:00 – 20:00',
      layanan: ['Service HP', 'Jual Beli', 'Unlock', 'Flashing'],
      badge: 'Top Seller',
      coverImage:
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop',
      listingStatus: 'APPROVED',
      isPublished: true,
      profileViews: 1284,
      totalSold: 2341,
    },
  })

  // ---- WALLETS ----
  await prisma.wallet.create({ data: { userId: admin.id, balance: 0 } })
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
      soldCount: 12,
      stock: 3,
      listingStatus: 'APPROVED',
      isPublished: true,
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
      soldCount: 8,
      stock: 2,
      listingStatus: 'APPROVED',
      isPublished: true,
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
      soldCount: 0,
      stock: 99,
      listingStatus: 'PENDING',
      isPublished: false,
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

  // ---- IMEI SERVICE ----
  // API Providers
  const dhruApi1 = await prisma.imeiApi.create({
    data: {
      title: 'DhruFusion Server 1',
      host: 'https://dhru1.example.com',
      username: 'admin@dhru1.com',
      apiKey: 'sk_demo_dhru1_key',
      apiType: 'DhruFusion',
      libraryId: 1,
      status: 'ACTIVE',
    },
  })

  const dhruApi2 = await prisma.imeiApi.create({
    data: {
      title: 'DhruFusion Server 2',
      host: 'https://dhru2.example.com',
      username: 'reseller@dhru2.com',
      apiKey: 'sk_demo_dhru2_key',
      apiType: 'DhruFusion',
      libraryId: 1,
      status: 'ACTIVE',
    },
  })

  // Service Groups
  const groupSamsung = await prisma.imeiServiceGroup.create({
    data: { title: 'Samsung Unlock', sortOrder: 1 },
  })
  const groupiPhone = await prisma.imeiServiceGroup.create({
    data: { title: 'iPhone iCloud', sortOrder: 2 },
  })
  const groupXiaomi = await prisma.imeiServiceGroup.create({
    data: { title: 'Xiaomi Unlock', sortOrder: 3 },
  })
  const groupCheck = await prisma.imeiServiceGroup.create({
    data: { title: 'IMEI Check', sortOrder: 4 },
  })
  const groupNetwork = await prisma.imeiServiceGroup.create({
    data: { title: 'Network Unlock', sortOrder: 5 },
  })
  const groupFrp = await prisma.imeiServiceGroup.create({
    data: { title: 'FRP Remove', sortOrder: 6 },
  })

  // Services
  const svc1 = await prisma.imeiService.create({
    data: {
      apiId: dhruApi1.id,
      groupId: groupSamsung.id,
      title: 'Samsung Galaxy S24 Ultra Unlock (All Carriers)',
      description: 'Unlock Samsung Galaxy S24 Ultra dari semua carrier. Permanent unlock via server.',
      price: 150000,
      deliveryTime: '1-24 jam',
      status: 'ACTIVE',
      requiresImei: true,
      requiresNetwork: true,
      requiresModel: true,
    },
  })

  await prisma.imeiService.create({
    data: {
      apiId: dhruApi1.id,
      groupId: groupSamsung.id,
      title: 'Samsung Galaxy A Series Unlock',
      description: 'Unlock Samsung Galaxy A series (A14, A34, A54, A74). Fast delivery.',
      price: 85000,
      deliveryTime: '1-12 jam',
      status: 'ACTIVE',
      requiresImei: true,
      requiresNetwork: true,
      requiresModel: true,
    },
  })

  await prisma.imeiService.create({
    data: {
      apiId: dhruApi1.id,
      groupId: groupiPhone.id,
      title: 'iPhone iCloud Removal (Clean)',
      description: 'Remove iCloud activation lock untuk iPhone dengan status Clean. IMEI harus bersih.',
      price: 500000,
      deliveryTime: '3-7 hari',
      status: 'ACTIVE',
      requiresImei: true,
      requiresModel: true,
    },
  })

  await prisma.imeiService.create({
    data: {
      apiId: dhruApi2.id,
      groupId: groupiPhone.id,
      title: 'iPhone iCloud Removal (Lost/Stolen)',
      description: 'Remove iCloud untuk iPhone dengan status Lost/Stolen. Proses lebih lama.',
      price: 1200000,
      deliveryTime: '7-14 hari',
      status: 'ACTIVE',
      requiresImei: true,
      requiresModel: true,
    },
  })

  await prisma.imeiService.create({
    data: {
      apiId: dhruApi2.id,
      groupId: groupXiaomi.id,
      title: 'Xiaomi Mi Account Unlock',
      description: 'Unlock Mi Account / Mi Cloud untuk semua device Xiaomi.',
      price: 120000,
      deliveryTime: '1-48 jam',
      status: 'ACTIVE',
      requiresImei: true,
      requiresModel: true,
    },
  })

  const svcCheck = await prisma.imeiService.create({
    data: {
      apiId: dhruApi1.id,
      groupId: groupCheck.id,
      title: 'IMEI Blacklist Check (Worldwide)',
      description: 'Cek status blacklist IMEI di seluruh dunia. Hasil instan.',
      price: 25000,
      deliveryTime: '1-5 menit',
      status: 'ACTIVE',
      requiresImei: true,
    },
  })

  await prisma.imeiService.create({
    data: {
      apiId: dhruApi1.id,
      groupId: groupCheck.id,
      title: 'iPhone Carrier Check + iCloud Status',
      description: 'Cek carrier lock, iCloud status, Find My iPhone, dan warranty info.',
      price: 35000,
      deliveryTime: '1-5 menit',
      status: 'ACTIVE',
      requiresImei: true,
    },
  })

  await prisma.imeiService.create({
    data: {
      apiId: dhruApi2.id,
      groupId: groupNetwork.id,
      title: 'AT&T iPhone Premium Unlock',
      description: 'Unlock iPhone dari AT&T. Semua model didukung. Premium service.',
      price: 350000,
      deliveryTime: '1-5 hari',
      status: 'ACTIVE',
      requiresImei: true,
      requiresNetwork: true,
      requiresModel: true,
      requiresProvider: true,
    },
  })

  await prisma.imeiService.create({
    data: {
      apiId: dhruApi1.id,
      groupId: groupFrp.id,
      title: 'Samsung FRP Remove (All Models)',
      description: 'Remove Factory Reset Protection (FRP/Google Lock) Samsung semua model.',
      price: 75000,
      deliveryTime: '1-24 jam',
      status: 'ACTIVE',
      requiresImei: true,
      requiresModel: true,
    },
  })

  // Sample IMEI Orders
  await prisma.imeiOrder.create({
    data: {
      orderCode: 'IMEI-2026-A1B2C3',
      userId: user1.id,
      serviceId: svc1.id,
      imei: '356938035643809',
      price: 150000,
      status: 'SUCCESS',
      code: 'NCK: 12345678\nFREEZE: 87654321',
      comments: 'Unlock code berhasil digenerate',
      processedAt: new Date('2026-05-14T10:35:00Z'),
      completedAt: new Date('2026-05-14T11:45:00Z'),
    },
  })

  await prisma.imeiOrder.create({
    data: {
      orderCode: 'IMEI-2026-D4E5F6',
      userId: user2.id,
      serviceId: svcCheck.id,
      imei: '353456789012345',
      price: 25000,
      status: 'SUCCESS',
      code: 'Status: CLEAN\nCarrier: Telkomsel\nCountry: Indonesia',
      processedAt: new Date('2026-05-14T09:15:30Z'),
      completedAt: new Date('2026-05-14T09:16:00Z'),
    },
  })

  await prisma.imeiOrder.create({
    data: {
      orderCode: 'IMEI-2026-G7H8I9',
      userId: user1.id,
      serviceId: svc1.id,
      imei: '867530012345678',
      price: 150000,
      status: 'PENDING',
      note: 'Galaxy S24 Ultra warna hitam',
    },
  })

  // ---- CHAT (User ↔ Teknisi) ----
  const chat1 = await prisma.chatConversation.create({
    data: {
      userId: user1.id,
      teknisiId: teknisi1.id,
      lastMessageAt: new Date('2026-05-18T10:30:00+07:00'),
    },
  })

  const chatMessages = [
    {
      conversationId: chat1.id,
      senderId: user1.id,
      body: 'Halo, saya butuh bantuan unlock iPhone 13',
      createdAt: new Date('2026-05-18T10:25:00+07:00'),
      readAt: new Date('2026-05-18T10:26:00+07:00'),
    },
    {
      conversationId: chat1.id,
      senderId: teknisi1.id,
      body: 'Halo, baik. Saya bisa bantu. Bisa kirim IMEI-nya?',
      createdAt: new Date('2026-05-18T10:26:00+07:00'),
      readAt: new Date('2026-05-18T10:27:00+07:00'),
    },
    {
      conversationId: chat1.id,
      senderId: user1.id,
      body: 'IMEI: 123456789012345',
      createdAt: new Date('2026-05-18T10:27:00+07:00'),
      readAt: new Date('2026-05-18T10:28:00+07:00'),
    },
    {
      conversationId: chat1.id,
      senderId: teknisi1.id,
      body: 'Baik, saya akan bantu unlock iPhone Anda',
      createdAt: new Date('2026-05-18T10:30:00+07:00'),
      readAt: null,
    },
  ]

  for (const msg of chatMessages) {
    await prisma.chatMessage.create({ data: msg })
  }

  const chat2 = await prisma.chatConversation.create({
    data: {
      userId: user2.id,
      teknisiId: teknisi2.id,
      lastMessageAt: new Date('2026-05-17T14:30:00+07:00'),
    },
  })

  await prisma.chatMessage.createMany({
    data: [
      {
        conversationId: chat2.id,
        senderId: user2.id,
        body: 'Kapan barang bisa diambil?',
        createdAt: new Date('2026-05-17T14:00:00+07:00'),
        readAt: new Date('2026-05-17T14:01:00+07:00'),
      },
      {
        conversationId: chat2.id,
        senderId: teknisi2.id,
        body: 'Barang sudah ready untuk diambil',
        createdAt: new Date('2026-05-17T14:30:00+07:00'),
        readAt: new Date('2026-05-17T14:31:00+07:00'),
      },
    ],
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
