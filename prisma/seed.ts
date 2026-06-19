import { PrismaClient, UserRole, ProductCategory, JobType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hash } from 'bcryptjs'
import 'dotenv/config'
import { seedTopupCatalog } from './seed-topup-catalog'
import { seedPlatformContent } from './seed-platform-content'
import { ensureMarketplaceOrderSettlement } from '../src/lib/marketplace-wallet'
import {
  DEFAULT_BRAND_FOCUS,
  DEFAULT_ISSUES_HANDLED,
  DEFAULT_SERVICE_SCOPE,
  DEFAULT_WORK_APPROACH,
  buildDefaultTagline,
  defaultConsultationServices,
} from '../src/lib/teknisi-profile-content'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data (child tables first — respect FK order)
  await prisma.activityLog.deleteMany()
  await prisma.orderTrackingEvent.deleteMany()
  await prisma.serverOrder.deleteMany()
  await prisma.imeiOrder.deleteMany()
  await prisma.serverService.deleteMany()
  await prisma.imeiService.deleteMany()
  await prisma.serverServiceBox.deleteMany()
  await prisma.imeiServiceGroup.deleteMany()
  await prisma.imeiApi.deleteMany()
  // WalletLedger has append-only protection — delete Wallet first (cascade takes ledger)
  // then forcefully clean any remaining rows
  await prisma.wallet.deleteMany()
  await prisma.$executeRawUnsafe('TRUNCATE "WalletLedger"')
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.rekberTransaction.deleteMany()
  await prisma.topupOrder.deleteMany()
  await prisma.topupDenomination.deleteMany()
  await prisma.topupCatalogProduct.deleteMany()
  await prisma.indodeskDownload.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.chatConversation.deleteMany()
  await prisma.teknisiStore.deleteMany()
  await prisma.konsultasiSession.deleteMany()
  await prisma.remoteSession.deleteMany()
  await prisma.lowonganApplication.deleteMany()
  await prisma.lowongan.deleteMany()
  await prisma.product.deleteMany()
  await prisma.teknisiReview.deleteMany()
  await prisma.teknisiPortfolioCase.deleteMany()
  await prisma.teknisiCertification.deleteMany()
  await prisma.teknisiProfile.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.helpArticle.deleteMany()
  await prisma.platformSetting.deleteMany()
  await prisma.marketplaceBanner.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await hash('password123', 12)
  const seedEmailVerified = new Date()

  // ---- USERS ----
  const admin = await prisma.user.create({
    data: {
      name: 'Admin IndoTeknizi',
      email: 'admin@indoteknizi.com',
      password: passwordHash,
      role: UserRole.ADMIN,
      phone: '+62 812-0000-0001',
      emailVerified: seedEmailVerified,
      mustChangePassword: true,
    },
  })

  const TEKNISI_AVATAR_AHMAD =
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
  const TEKNISI_AVATAR_BUDI =
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
  const TEKNISI_COVER_AHMAD =
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1400&h=500&fit=crop'
  const TEKNISI_COVER_BUDI =
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837a?w=1400&h=500&fit=crop'

  const teknisi1 = await prisma.user.create({
    data: {
      name: 'Ahmad Hidayat',
      email: 'ahmad@indoteknizi.com',
      password: passwordHash,
      role: UserRole.TEKNISI,
      phone: '+62 812-1111-1111',
      image: TEKNISI_AVATAR_AHMAD,
      emailVerified: seedEmailVerified,
    },
  })

  const teknisi2 = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi@indoteknizi.com',
      password: passwordHash,
      role: UserRole.TEKNISI,
      phone: '+62 812-2222-2222',
      image: TEKNISI_AVATAR_BUDI,
      emailVerified: seedEmailVerified,
    },
  })

  const user1 = await prisma.user.create({
    data: {
      name: 'Siti Nurhaliza',
      email: 'siti@gmail.com',
      password: passwordHash,
      role: UserRole.USER,
      phone: '+62 812-3333-3333',
      emailVerified: seedEmailVerified,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'Rudi Hartono',
      email: 'rudi@gmail.com',
      password: passwordHash,
      role: UserRole.USER,
      phone: '+62 812-4444-4444',
      emailVerified: seedEmailVerified,
    },
  })

  const user3 = await prisma.user.create({
    data: {
      name: 'Dewi Lestari',
      email: 'dewi@gmail.com',
      password: passwordHash,
      role: UserRole.USER,
      phone: '+62 812-5555-5555',
      emailVerified: seedEmailVerified,
    },
  })

  // ---- TEKNISI PROFILES ----
  const teknisi1Specialty = ['Unlock', 'Flashing', 'Root', 'Hardware Repair']
  const teknisi1Price = 50000

  await prisma.teknisiProfile.create({
    data: {
      userId: teknisi1.id,
      specialty: teknisi1Specialty,
      experience: '8 tahun',
      coverImage: TEKNISI_COVER_AHMAD,
      location: 'Jakarta Selatan',
      description: 'Teknisi handphone berpengalaman dengan spesialisasi unlock, flashing, dan root berbagai brand.',
      tagline: buildDefaultTagline(teknisi1Specialty),
      issuesHandled: DEFAULT_ISSUES_HANDLED,
      brandFocus: DEFAULT_BRAND_FOCUS,
      workApproach: DEFAULT_WORK_APPROACH,
      serviceScope: DEFAULT_SERVICE_SCOPE,
      languages: ['Indonesia'],
      secondarySkills: [
        'Screen Replacement',
        'Water Damage',
        'Remote Troubleshooting',
        'Software Installation',
        'Device Optimization',
        'Data Recovery',
      ],
      operatingHours: {
        senin: { open: '09:00', close: '21:00', closed: false },
        selasa: { open: '09:00', close: '21:00', closed: false },
        rabu: { open: '09:00', close: '21:00', closed: false },
        kamis: { open: '09:00', close: '21:00', closed: false },
        jumat: { open: '09:00', close: '21:00', closed: false },
        sabtu: { open: '10:00', close: '18:00', closed: false },
        minggu: { open: '', close: '', closed: true },
      },
      consultationServices: defaultConsultationServices(teknisi1Specialty, teknisi1Price),
      rating: 4.9,
      reviewCount: 234,
      totalKonsultasi: 567,
      totalView: 1234,
      responseTime: '< 5 menit',
      completionRate: 98,
      isOnline: false,
      isVerified: true,
      price: teknisi1Price,
    },
  })

  await prisma.teknisiProfile.create({
    data: {
      userId: teknisi2.id,
      specialty: ['Hardware Repair', 'Screen Replacement', 'Water Damage'],
      experience: '5 tahun',
      coverImage: TEKNISI_COVER_BUDI,
      location: 'Jakarta Pusat',
      description: 'Spesialis perbaikan hardware handphone, screen replacement, dan water damage recovery.',
      rating: 4.7,
      reviewCount: 189,
      totalKonsultasi: 342,
      totalView: 892,
      responseTime: '< 10 menit',
      completionRate: 95,
      isOnline: false,
      isVerified: true,
      price: 75000,
    },
  })

  // ---- TEKNISI REVIEWS (ulasan profil) ----
  await prisma.teknisiReview.createMany({
    data: [
      {
        teknisiId: teknisi1.id,
        authorId: user1.id,
        rating: 5,
        tag: 'Problem solved',
        comment:
          'Diagnosisnya jelas, estimasi biaya transparan, dan perangkat kembali normal di hari yang sama.',
      },
      {
        teknisiId: teknisi1.id,
        authorId: user2.id,
        rating: 5,
        tag: 'Fast response',
        comment:
          'Respons chat cepat dan penjelasannya mudah dipahami. Cocok untuk konsultasi sebelum datang ke toko.',
      },
      {
        teknisiId: teknisi1.id,
        authorId: user3.id,
        rating: 4,
        tag: 'Professional',
        comment:
          'Pengerjaan rapi, update progres rutin, dan ada garansi setelah servis selesai.',
      },
    ],
  })

  for (const tid of [teknisi1.id, teknisi2.id]) {
    const reviews = await prisma.teknisiReview.findMany({
      where: { teknisiId: tid },
      select: { rating: true },
    })
    const count = reviews.length
    const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
    await prisma.teknisiProfile.update({
      where: { userId: tid },
      data: { reviewCount: count, rating: Math.round(avg * 10) / 10 },
    })
  }

  // ---- TEKNISI PORTFOLIO (case highlights + foto servis) ----
  const PORTFOLIO_IMG = {
    phoneRepair:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop',
    screenService:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
    laptopService:
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop',
    waterDamage:
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=600&fit=crop',
    batteryService:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    boardRepair:
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop',
  }

  await prisma.teknisiPortfolioCase.createMany({
    data: [
      {
        teknisiId: teknisi1.id,
        title: 'Recovery perangkat mati total',
        meta: 'Android flagship · 48 jam',
        result: 'Data aman, board kembali stabil',
        imageUrl: PORTFOLIO_IMG.boardRepair,
        icon: 'smartphone',
        tone: 'from-primary-500 to-emerald-600',
        glow: 'rgba(16,185,129,0.4)',
        sortOrder: 0,
      },
      {
        teknisiId: teknisi1.id,
        title: 'Screen replacement presisi',
        meta: 'OLED display · 90 menit',
        result: 'Touch, True Tone, dan seal diuji ulang',
        imageUrl: PORTFOLIO_IMG.screenService,
        icon: 'wrench',
        tone: 'from-cyan-500 to-blue-600',
        glow: 'rgba(6,182,212,0.4)',
        sortOrder: 1,
      },
      {
        teknisiId: teknisi1.id,
        title: 'Remote software cleanup',
        meta: 'Laptop & mobile · 35 menit',
        result: 'Boot lebih cepat, aplikasi error selesai',
        imageUrl: PORTFOLIO_IMG.laptopService,
        icon: 'laptop',
        tone: 'from-violet-500 to-fuchsia-600',
        glow: 'rgba(139,92,246,0.4)',
        sortOrder: 2,
      },
      {
        teknisiId: teknisi2.id,
        title: 'Water damage recovery',
        meta: 'iPhone 14 Pro · 24 jam',
        result: 'Korosi dibersihkan, power rail kembali normal',
        imageUrl: PORTFOLIO_IMG.waterDamage,
        icon: 'smartphone',
        tone: 'from-primary-500 to-emerald-600',
        glow: 'rgba(16,185,129,0.4)',
        sortOrder: 0,
      },
      {
        teknisiId: teknisi2.id,
        title: 'Screen replacement presisi',
        meta: 'OLED display · 90 menit',
        result: 'Touch, True Tone, dan seal diuji ulang',
        imageUrl: PORTFOLIO_IMG.phoneRepair,
        icon: 'wrench',
        tone: 'from-cyan-500 to-blue-600',
        glow: 'rgba(6,182,212,0.4)',
        sortOrder: 1,
      },
      {
        teknisiId: teknisi2.id,
        title: 'Battery health restore',
        meta: 'Samsung Galaxy · 45 menit',
        result: 'Kapasitas kembali stabil, tidak shutdown mendadak',
        imageUrl: PORTFOLIO_IMG.batteryService,
        icon: 'laptop',
        tone: 'from-violet-500 to-fuchsia-600',
        glow: 'rgba(139,92,246,0.4)',
        sortOrder: 2,
      },
    ],
  })

  await prisma.teknisiCertification.createMany({
    data: [
      {
        teknisiId: teknisi1.id,
        title: 'Apple Certified iOS Technician',
        fileUrl:
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
        fileType: 'image',
        sortOrder: 0,
      },
      {
        teknisiId: teknisi1.id,
        title: 'Sertifikat Board Repair Level 2',
        fileUrl:
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
        fileType: 'image',
        sortOrder: 1,
      },
    ],
  })

  // ---- TEKNISI STORES ----
  await prisma.teknisiStore.create({
    data: {
      userId: teknisi1.id,
      name: 'HandPhone Center Jakarta',
      city: 'Jakarta',
      address: 'Jl. Thamrin No. 123, Jakarta Pusat',
      phone: '0812-3456-7890',
      email: 'info@handphonecenter.id',
      instagram: 'handphonecenter.jkt',
      threads: 'handphonecenter.jkt',
      tiktok: 'handphonecenter.jkt',
      jamWeekdays: '09:00 – 21:00',
      jamWeekend: '10:00 – 20:00',
      operatingHours: {
        senin: { open: '09:00', close: '21:00', closed: false },
        selasa: { open: '09:00', close: '21:00', closed: false },
        rabu: { open: '09:00', close: '21:00', closed: false },
        kamis: { open: '09:00', close: '21:00', closed: false },
        jumat: { open: '09:00', close: '21:00', closed: false },
        sabtu: { open: '10:00', close: '20:00', closed: false },
        minggu: { open: '10:00', close: '20:00', closed: false },
      },
      gallery: [
        'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&h=900&fit=crop',
        'https://images.unsplash.com/photo-1581993192873-bf60d213b08e?w=900&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=1200&h=900&fit=crop',
        'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=900&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1601972602288-3be527b4f18d?w=1200&h=900&fit=crop',
        'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=900&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1200&h=900&fit=crop',
        'https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?w=900&h=1200&fit=crop',
      ],
      journeyIntro:
        'Dari servis online hingga toko fisik — perjalanan membangun kepercayaan pelanggan satu per satu.',
      journey: [
        {
          year: '2020',
          title: 'Servis Online',
          description:
            'Memulai dari konsultasi & troubleshooting jarak jauh via chat dan remote desktop.',
          icon: 'message',
        },
        {
          year: '2021',
          title: 'Servis Rumahan',
          description:
            'Menerima perangkat dari pelanggan sekitar untuk diperbaiki di rumah. Mulai bangun reputasi.',
          icon: 'wrench',
        },
        {
          year: '2023',
          title: 'Workshop Kecil',
          description:
            'Menyewa tempat kecil, melengkapi peralatan profesional, dan menerima lebih banyak unit.',
          icon: 'store',
        },
        {
          year: '2024',
          title: 'Toko Resmi',
          description:
            'Membuka toko fisik lengkap dengan etalase produk, layanan walk-in, dan tim teknisi.',
          icon: 'award',
        },
      ],
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
  await prisma.wallet.create({ data: { userId: user1.id, balance: 9000000 } })
  await prisma.wallet.create({ data: { userId: user2.id, balance: 250000 } })
  await prisma.wallet.create({ data: { userId: user3.id, balance: 100000 } })

  // ---- PRODUCTS (terhubung dengan akun teknisi, data siap test) ----

  // Produk 1: iPhone milik Ahmad (teknisi1) — lengkap dengan 3uTools
  const product1 = await prisma.product.create({
    data: {
      sellerId: teknisi1.id,
      name: 'iPhone 13 Pro Max 256GB - Graphite',
      category: ProductCategory.IPHONE,
      price: 8500000,
      description:
        'iPhone 13 Pro Max 256GB Graphite. Kondisi 95% like new, layar mulus tanpa scratch, body tidak ada penyok. Baterai health 89%. Face ID, True Tone, semua sensor berfungsi normal. Fullset: unit + charger + box. Garansi toko 1 bulan.',
      color: 'Graphite',
      ram: '6GB',
      processor: 'A15 Bionic',
      storage: '256GB',
      warranty: 'STORE',
      completeness: ['IPHONE', 'CHARGER', 'BOX'],
      deviceType: 'IPHONE',
      conditionGrade: 'MULUS',
      conditionPercent: 95,
      batteryHealth: 89,
      batteryCycle: 320,
      isAllOriginal: true,
      trueToneActive: true,
      faceIdWorks: true,
      verified3uTools: true,
      image: 'https://images.unsplash.com/photo-1632633173522-47456de71b76?w=800&h=600&fit=crop',
      images: [
        { url: 'https://images.unsplash.com/photo-1632633173522-47456de71b76?w=800&h=600&fit=crop', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&h=600&fit=crop', isPrimary: false },
        { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop', isPrimary: false },
      ],
      threeUtoolsImages: [
        { url: 'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?w=800&h=600&fit=crop', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop', isPrimary: false },
      ],
      rating: 4.8,
      reviewCount: 12,
      views: 2341,
      soldCount: 3,
      stock: 2,
      listingStatus: 'APPROVED',
      isPublished: true,
    },
  })

  // Produk 2: Samsung milik Budi (teknisi2) — tanpa 3uTools (bukan Apple)
  const product2 = await prisma.product.create({
    data: {
      sellerId: teknisi2.id,
      name: 'Samsung Galaxy S24 Ultra 512GB - Titanium Gray',
      category: ProductCategory.IPHONE,
      price: 15900000,
      description:
        'Samsung Galaxy S24 Ultra 512GB Titanium Gray. Unit mulus 98%, baru pemakaian 3 bulan. S Pen berfungsi sempurna, kamera 200MP jernih. Baterai 95% health. Fullset lengkap + bonus case original. Garansi resmi SEIN aktif.',
      color: 'Titanium Gray',
      ram: '12GB',
      processor: 'Snapdragon 8 Gen 3',
      storage: '512GB',
      warranty: 'OFFICIAL',
      completeness: ['HANDPHONE', 'CHARGER', 'BOX', 'EARPHONE'],
      deviceType: 'ANDROID_PHONE',
      conditionGrade: 'LIKE_NEW',
      conditionPercent: 98,
      image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=600&fit=crop',
      images: [
        { url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=600&fit=crop', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop', isPrimary: false },
      ],
      threeUtoolsImages: [],
      rating: 4.9,
      reviewCount: 8,
      views: 1892,
      soldCount: 1,
      stock: 1,
      listingStatus: 'APPROVED',
      isPublished: true,
    },
  })

  // Produk 3: iPhone milik Ahmad (teknisi1) — budget, dengan 3uTools
  const product3 = await prisma.product.create({
    data: {
      sellerId: teknisi1.id,
      name: 'iPhone 11 64GB - Black',
      category: ProductCategory.IPHONE,
      price: 4200000,
      description:
        'iPhone 11 64GB Black. Kondisi 85%, ada minor scratch di body samping (tidak terlihat saat pakai case). Baterai health 82%. Semua fungsi normal: Face ID, kamera, speaker, charging. Unit only + charger aftermarket.',
      color: 'Black',
      ram: '4GB',
      processor: 'A13 Bionic',
      storage: '64GB',
      warranty: 'STORE',
      completeness: ['IPHONE', 'CHARGER'],
      deviceType: 'IPHONE',
      conditionGrade: 'NORMAL',
      conditionPercent: 85,
      minusNotes: 'Lecet halus di body samping kiri',
      batteryHealth: 82,
      batteryCycle: 540,
      isAllOriginal: false,
      replacedParts: ['Battery'],
      trueToneActive: true,
      faceIdWorks: true,
      verified3uTools: true,
      image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&h=600&fit=crop',
      images: [
        { url: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&h=600&fit=crop', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&h=600&fit=crop', isPrimary: false },
      ],
      threeUtoolsImages: [
        { url: 'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?w=800&h=600&fit=crop', isPrimary: true },
      ],
      rating: 4.5,
      reviewCount: 24,
      views: 3102,
      soldCount: 7,
      stock: 3,
      listingStatus: 'APPROVED',
      isPublished: true,
    },
  })

  // Produk 3b: iPhone 12 milik Budi — untuk uji benchmark iPhone vs iPhone
  await prisma.product.create({
    data: {
      sellerId: teknisi2.id,
      name: 'iPhone 12 128GB - Blue',
      category: ProductCategory.IPHONE,
      price: 5800000,
      description:
        'iPhone 12 128GB Blue. Kondisi mulus 92%, baterai sehat. Fullset original. Face ID & True Tone normal.',
      color: 'Blue',
      ram: '4GB',
      processor: 'A14 Bionic',
      storage: '128GB',
      warranty: 'STORE',
      completeness: ['FULLSET'],
      deviceType: 'IPHONE',
      conditionGrade: 'MULUS',
      conditionPercent: 92,
      batteryHealth: 91,
      batteryCycle: 210,
      isAllOriginal: true,
      trueToneActive: true,
      faceIdWorks: true,
      verified3uTools: true,
      image: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&h=600&fit=crop',
      images: [
        { url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&h=600&fit=crop', isPrimary: true },
      ],
      threeUtoolsImages: [
        { url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop', isPrimary: true },
      ],
      rating: 4.7,
      reviewCount: 0,
      views: 540,
      soldCount: 0,
      stock: 2,
      listingStatus: 'APPROVED',
      isPublished: true,
    },
  })

  // Produk 4: Laptop milik Budi (teknisi2)
  await prisma.product.create({
    data: {
      sellerId: teknisi2.id,
      name: 'MacBook Air M2 256GB - Midnight',
      category: ProductCategory.LAPTOP,
      price: 12500000,
      description:
        'MacBook Air M2 2022 256GB Midnight. Kondisi 92%, layar mulus, keyboard responsive, trackpad sempurna. Cycle count 87. Fullset: unit + charger MagSafe + box. Garansi toko 1 bulan.',
      color: 'Midnight',
      ram: '8GB',
      processor: 'Apple M2',
      storage: '256GB',
      warranty: 'STORE',
      completeness: ['IPHONE', 'CHARGER', 'BOX'],
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop',
      images: [
        { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop', isPrimary: false },
      ],
      threeUtoolsImages: [],
      rating: 4.7,
      reviewCount: 5,
      views: 890,
      soldCount: 2,
      stock: 1,
      listingStatus: 'APPROVED',
      isPublished: true,
    },
  })

  // Produk 5: Aksesoris milik Ahmad (teknisi1)
  await prisma.product.create({
    data: {
      sellerId: teknisi1.id,
      name: 'Charger iPhone 20W USB-C Original',
      category: ProductCategory.AKSESORIS,
      price: 185000,
      description:
        'Charger iPhone 20W USB-C original Apple. Baru, segel. Support fast charging untuk iPhone 8 ke atas dan iPad. Garansi toko 1 minggu.',
      color: 'White',
      ram: '',
      processor: '',
      storage: '',
      warranty: 'STORE',
      completeness: [],
      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop',
      images: [
        { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop', isPrimary: true },
      ],
      threeUtoolsImages: [],
      rating: 4.9,
      reviewCount: 45,
      views: 4520,
      soldCount: 32,
      stock: 15,
      listingStatus: 'APPROVED',
      isPublished: true,
    },
  })

  // Produk 6: iPhone iPad milik Budi — PENDING (belum approved, untuk test admin approval)
  await prisma.product.create({
    data: {
      sellerId: teknisi2.id,
      name: 'iPad Pro 11" M2 128GB WiFi - Space Gray',
      category: ProductCategory.IPHONE,
      price: 9800000,
      description:
        'iPad Pro 11 inch M2 2022 128GB WiFi Space Gray. Kondisi 90%, layar sempurna, Apple Pencil 2 support. Baterai health 91%. Unit + charger + box.',
      color: 'Space Gray',
      ram: '8GB',
      processor: 'Apple M2',
      storage: '128GB',
      warranty: 'STORE',
      completeness: ['IPHONE', 'CHARGER', 'BOX'],
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=600&fit=crop',
      images: [
        { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=600&fit=crop', isPrimary: true },
      ],
      threeUtoolsImages: [
        { url: 'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?w=800&h=600&fit=crop', isPrimary: true },
      ],
      rating: 0,
      reviewCount: 0,
      views: 0,
      soldCount: 0,
      stock: 1,
      listingStatus: 'PENDING',
      isPublished: false,
    },
  })

  // ---- SAMPLE ORDER ----
  const sampleOrder = await prisma.order.create({
    data: {
      orderCode: 'ORD-2026-000001',
      buyerId: user1.id,
      sellerId: teknisi1.id,
      subtotal: 8500000,
      total: 8500000,
      status: 'COMPLETED',
      createdAt: new Date('2026-05-16T14:30:00+07:00'),
      shippingCourier: 'JNE',
      trackingNumber: 'JNE1234567890',
      trackingSummaryStatus: 'DELIVERED',
      trackingSummaryDesc: 'Paket telah diterima oleh penerima',
      trackingLastEventAt: new Date('2026-05-18T14:30:00+07:00'),
      trackingLastSyncedAt: new Date('2026-05-18T15:00:00+07:00'),
      trackingActive: false,
      shippedAt: new Date('2026-05-15T10:00:00+07:00'),
      items: {
        create: {
          productId: product1.id,
          quantity: 1,
          price: 8500000,
        },
      },
    },
  })

  // ---- TRACKING EVENTS for ORD-2026-000001 ----
  await prisma.orderTrackingEvent.createMany({
    data: [
      {
        orderId: sampleOrder.id,
        occurredAt: new Date('2026-05-15T10:00:00+07:00'),
        description: 'Paket telah diambil oleh kurir dari alamat pengirim',
        location: 'Jakarta Selatan',
      },
      {
        orderId: sampleOrder.id,
        occurredAt: new Date('2026-05-15T14:30:00+07:00'),
        description: 'Paket tiba di gudang sortir JNE Jakarta',
        location: 'JNE Hub Jakarta Pusat',
      },
      {
        orderId: sampleOrder.id,
        occurredAt: new Date('2026-05-15T22:00:00+07:00'),
        description: 'Paket dalam proses pengiriman antar kota',
        location: 'JNE Gateway Jakarta',
      },
      {
        orderId: sampleOrder.id,
        occurredAt: new Date('2026-05-16T06:15:00+07:00'),
        description: 'Paket tiba di kota tujuan',
        location: 'JNE Hub Bandung',
      },
      {
        orderId: sampleOrder.id,
        occurredAt: new Date('2026-05-16T09:00:00+07:00'),
        description: 'Paket sedang dalam proses sortir di cabang tujuan',
        location: 'JNE Cabang Bandung Kota',
      },
      {
        orderId: sampleOrder.id,
        occurredAt: new Date('2026-05-16T11:30:00+07:00'),
        description: 'Paket sedang diantar oleh kurir ke alamat penerima',
        location: 'Bandung Kota',
      },
      {
        orderId: sampleOrder.id,
        occurredAt: new Date('2026-05-16T14:30:00+07:00'),
        description: 'Paket telah diterima oleh penerima (Siti Nurhaliza)',
        location: 'Bandung, Jl. Merdeka No. 45',
      },
    ],
  })

  await ensureMarketplaceOrderSettlement(sampleOrder.id)
  await prisma.walletLedger.updateMany({
    where: { referenceId: sampleOrder.id },
    data: { createdAt: new Date('2026-05-16T14:30:00+07:00') },
  })

  // ---- PRODUCT REVIEWS (ulasan produk dari pembeli) ----
  // Buat beberapa order completed untuk bisa seed review (@@unique orderId+productId)
  const reviewOrder2 = await prisma.order.create({
    data: {
      orderCode: 'ORD-2026-000002',
      buyerId: user2.id,
      sellerId: teknisi1.id,
      subtotal: 8500000,
      total: 8500000,
      status: 'COMPLETED',
      completedAt: new Date('2026-05-20T10:00:00+07:00'),
      items: { create: { productId: product1.id, quantity: 1, price: 8500000 } },
    },
  })
  const reviewOrder3 = await prisma.order.create({
    data: {
      orderCode: 'ORD-2026-000003',
      buyerId: user2.id,
      sellerId: teknisi1.id,
      subtotal: 4200000,
      total: 4200000,
      status: 'COMPLETED',
      completedAt: new Date('2026-05-21T10:00:00+07:00'),
      items: { create: { productId: product3.id, quantity: 1, price: 4200000 } },
    },
  })
  const reviewOrder4 = await prisma.order.create({
    data: {
      orderCode: 'ORD-2026-000004',
      buyerId: user3.id,
      sellerId: teknisi1.id,
      subtotal: 4200000,
      total: 4200000,
      status: 'COMPLETED',
      completedAt: new Date('2026-05-22T10:00:00+07:00'),
      items: { create: { productId: product3.id, quantity: 1, price: 4200000 } },
    },
  })
  const reviewOrder5 = await prisma.order.create({
    data: {
      orderCode: 'ORD-2026-000005',
      buyerId: user1.id,
      sellerId: teknisi2.id,
      subtotal: 15900000,
      total: 15900000,
      status: 'COMPLETED',
      completedAt: new Date('2026-05-19T14:00:00+07:00'),
      items: { create: { productId: product2.id, quantity: 1, price: 15900000 } },
    },
  })
  const reviewOrder6 = await prisma.order.create({
    data: {
      orderCode: 'ORD-2026-000006',
      buyerId: user3.id,
      sellerId: teknisi2.id,
      subtotal: 15900000,
      total: 15900000,
      status: 'COMPLETED',
      completedAt: new Date('2026-05-23T14:00:00+07:00'),
      items: { create: { productId: product2.id, quantity: 1, price: 15900000 } },
    },
  })

  await prisma.productReview.createMany({
    data: [
      {
        productId: product1.id,
        orderId: sampleOrder.id,
        authorId: user1.id,
        rating: 5,
        comment:
          'iPhone 13 Pro Max nya mantap! Kondisi sesuai deskripsi, layar mulus, baterai masih bagus. Packing rapi dan pengiriman cepat. Recommended seller!',
      },
      {
        productId: product1.id,
        orderId: reviewOrder2.id,
        authorId: user2.id,
        rating: 5,
        comment:
          'Beli buat istri, dia senang banget. Warna Graphite elegan, ProMotion display smooth. Teknisi juga kasih tips cara rawat baterai. Top!',
      },
      {
        productId: product3.id,
        orderId: reviewOrder3.id,
        authorId: user2.id,
        rating: 5,
        comment:
          'iPhone 11 nya kondisi bagus, sesuai foto. Face ID lancar, kamera jernih. Harga sangat worth it untuk unit second. Garansi toko bikin tenang.',
      },
      {
        productId: product3.id,
        orderId: reviewOrder4.id,
        authorId: user3.id,
        rating: 4,
        comment:
          'Unit oke, cuma ada sedikit scratch di body samping seperti yang dibilang penjual. Overall puas, charging normal dan speaker lantang.',
      },
      {
        productId: product2.id,
        orderId: reviewOrder5.id,
        authorId: user1.id,
        rating: 5,
        comment:
          'Samsung S24 Ultra nya premium banget. S Pen responsive, kamera 200MP detail gila. Garansi SEIN masih panjang. Best purchase!',
      },
      {
        productId: product2.id,
        orderId: reviewOrder6.id,
        authorId: user3.id,
        rating: 4,
        comment:
          'Unit mulus dan lengkap. Satu minus: agak lama shipping karena beda kota. Tapi overall produk sesuai harapan.',
      },
    ],
  })

  // Update reviewCount pada produk yang di-review
  for (const pid of [product1.id, product2.id, product3.id]) {
    const count = await prisma.productReview.count({ where: { productId: pid } })
    const avgResult = await prisma.productReview.aggregate({
      where: { productId: pid },
      _avg: { rating: true },
    })
    await prisma.product.update({
      where: { id: pid },
      data: {
        reviewCount: count,
        rating: Math.round((avgResult._avg.rating ?? 0) * 100) / 100,
      },
    })
  }

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
  await prisma.lowongan.createMany({
    data: [
      {
        posterId: admin.id,
        title: 'Teknisi Handphone Senior',
        company: 'HandPhone Center Jakarta',
        location: 'Jakarta Selatan',
        salary: 'Rp 5 - 8 jt/bln',
        type: JobType.FULL_TIME,
        description:
          'Mencari teknisi handphone berpengalaman minimal 3 tahun untuk bergabung dengan tim service center kami.',
        requirements: [
          'Minimal 3 tahun pengalaman',
          'Menguasai berbagai brand',
          'Memahami hardware dan software',
        ],
        skills: ['iPhone', 'Samsung', 'Hardware'],
      },
      {
        posterId: admin.id,
        title: 'Teknisi Remote Support',
        company: 'TechSolution Store',
        location: 'Remote',
        salary: 'Rp 3 - 5 jt/bln',
        type: JobType.PART_TIME,
        description:
          'Diperlukan teknisi untuk memberikan konsultasi online dan remote troubleshooting.',
        requirements: ['Pengalaman remote support', 'Komunikasi baik'],
        skills: ['Software', 'Flashing', 'Unlock'],
      },
      {
        posterId: admin.id,
        title: 'Teknisi Laptop & Handphone',
        company: 'TechSolution Store',
        location: 'Bandung',
        salary: 'Rp 4 - 7 jt/bln',
        type: JobType.FULL_TIME,
        description: 'Teknisi laptop dan handphone untuk perbaikan hardware dan software.',
        requirements: ['Minimal 2 tahun pengalaman'],
        skills: ['Laptop', 'PC', 'Hardware'],
      },
      {
        posterId: admin.id,
        title: 'Freelance Teknisi Remote',
        company: 'Mobile Repair Online',
        location: 'Remote',
        salary: 'Per project',
        type: JobType.CONTRACT,
        description: 'Kesempatan kerja freelance dengan jadwal fleksibel.',
        requirements: ['Portfolio perbaikan'],
        skills: ['Root', 'Data Recovery'],
      },
    ],
  })

  await seedTopupCatalog(prisma)
  await seedPlatformContent(prisma)

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

  // ---- SERVER SERVICES ----
  const serverBoxTools = await prisma.serverServiceBox.create({
    data: { title: 'Firmware & Activation Tools', sortOrder: 1 },
  })

  const serverFieldDefsJson = JSON.stringify([
    { key: 'email', label: 'Email', required: true, type: 'email' },
    { key: 'username', label: 'Username', required: true, type: 'text' },
  ])

  const svcServerActive = await prisma.serverService.create({
    data: {
      apiId: dhruApi1.id,
      boxId: serverBoxTools.id,
      title: 'Sigma Key Activation (1 Year)',
      description: 'Aktivasi Sigma Key 1 tahun. Butuh email dan username akun Sigma.',
      price: 75000,
      deliveryTime: '1-24 jam',
      quantity: 1,
      requiredFields: serverFieldDefsJson,
      status: 'ACTIVE',
    },
  })

  await prisma.serverService.create({
    data: {
      apiId: dhruApi1.id,
      boxId: serverBoxTools.id,
      title: 'Legacy Server Tool (Inactive)',
      description: 'Layanan nonaktif untuk uji validasi.',
      price: 50000,
      deliveryTime: '—',
      quantity: 1,
      requiredFields: serverFieldDefsJson,
      status: 'INACTIVE',
    },
  })

  await prisma.serverOrder.create({
    data: {
      orderCode: 'SRV-2026-A1B2C3',
      userId: user1.id,
      serviceId: svcServerActive.id,
      price: 75000,
      status: 'SUCCESS',
      email: 'siti@gmail.com',
      requiredFields: JSON.stringify({
        email: 'siti@gmail.com',
        username: 'sigma_user_01',
      }),
      code: 'LICENSE-KEY: ABCD-1234-EFGH-5678',
      comments: 'Aktivasi berhasil',
      processedAt: new Date('2026-05-15T08:00:00Z'),
      completedAt: new Date('2026-05-15T10:30:00Z'),
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

  // ---- KONSULTASI SESSIONS (untuk Monitoring Admin) ----
  const konsultasiCompleted = await prisma.konsultasiSession.create({
    data: {
      userId: user1.id,
      teknisiId: teknisi1.id,
      service: 'Konsultasi Unlock',
      price: 50000,
      status: 'COMPLETED',
      rating: 5,
      review: 'Teknisi sangat membantu, unlock berhasil dalam waktu singkat. Penjelasannya juga jelas.',
      createdAt: new Date('2026-05-17T07:52:00+07:00'),
      startedAt: new Date('2026-05-17T08:00:00+07:00'),
      endedAt: new Date('2026-05-17T08:35:00+07:00'),
    },
  })

  const teknisi1Wallet = await prisma.wallet.findUnique({ where: { userId: teknisi1.id } })
  if (teknisi1Wallet) {
    await prisma.walletLedger.create({
      data: {
        walletId: teknisi1Wallet.id,
        type: 'EARNING',
        amount: 50000,
        balance: teknisi1Wallet.balance,
        description: 'Pendapatan konsultasi: Konsultasi Unlock',
        referenceId: konsultasiCompleted.id,
        createdAt: new Date('2026-05-17T08:35:00+07:00'),
      },
    })
  }

  await prisma.konsultasiSession.create({
    data: {
      userId: user2.id,
      teknisiId: teknisi2.id,
      service: 'Remote Flashing',
      price: 150000,
      status: 'ACTIVE',
      startedAt: new Date('2026-05-19T10:15:00+07:00'),
    },
  })

  await prisma.konsultasiSession.create({
    data: {
      userId: user3.id,
      teknisiId: teknisi1.id,
      service: 'Root & Custom ROM',
      price: 200000,
      status: 'PENDING',
    },
  })

  // ---- REMOTE SESSIONS (untuk Monitoring Admin) ----
  await prisma.remoteSession.create({
    data: {
      userId: user1.id,
      teknisiId: teknisi1.id,
      remoteId: '987 654 321',
      description: 'iPhone stuck di logo Apple setelah update iOS. Butuh bantuan restore via remote.',
      platform: 'Windows 11',
      status: 'WAITING',
    },
  })

  await prisma.remoteSession.create({
    data: {
      userId: user2.id,
      teknisiId: teknisi2.id,
      remoteId: '111 222 333',
      description: 'Unlock bootloader Samsung A54.',
      platform: 'macOS',
      status: 'IN_PROGRESS',
      acceptedAt: new Date('2026-05-19T09:00:00+07:00'),
    },
  })

  await prisma.remoteSession.create({
    data: {
      userId: user3.id,
      teknisiId: teknisi1.id,
      remoteId: '444 555 666',
      description: 'Backup data sebelum factory reset.',
      platform: 'Windows 11',
      status: 'COMPLETED',
      createdAt: new Date('2026-05-18T12:48:00+07:00'),
      acceptedAt: new Date('2026-05-18T13:00:00+07:00'),
      completedAt: new Date('2026-05-18T14:25:00+07:00'),
    },
  })

  // ---- ACTIVITY LOG (sample entries for admin Log Aktivitas page) ----
  const now = new Date()
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000)

  await prisma.activityLog.createMany({
    data: [
      {
        action: 'auth.login.success',
        category: 'AUTH',
        severity: 'SUCCESS',
        summary: 'Admin IndoTeknizi login',
        actorId: admin.id,
        actorName: 'Admin IndoTeknizi',
        actorEmail: 'admin@indoteknizi.com',
        actorRole: 'ADMIN',
        ip: '127.0.0.1',
        createdAt: ago(5),
      },
      {
        action: 'auth.login.success',
        category: 'AUTH',
        severity: 'SUCCESS',
        summary: 'Ahmad Hidayat login',
        actorId: teknisi1.id,
        actorName: 'Ahmad Hidayat',
        actorEmail: 'ahmad@indoteknizi.com',
        actorRole: 'TEKNISI',
        ip: '192.168.1.10',
        createdAt: ago(15),
      },
      {
        action: 'auth.login.success',
        category: 'AUTH',
        severity: 'SUCCESS',
        summary: 'Siti Nurhaliza login',
        actorId: user1.id,
        actorName: 'Siti Nurhaliza',
        actorEmail: 'siti@gmail.com',
        actorRole: 'USER',
        ip: '10.0.0.5',
        createdAt: ago(30),
      },
      {
        action: 'account.register',
        category: 'ACCOUNT',
        severity: 'SUCCESS',
        summary: 'Akun baru terdaftar: Dewi Lestari (USER)',
        actorId: user3.id,
        actorName: 'Dewi Lestari',
        actorEmail: 'dewi@gmail.com',
        actorRole: 'USER',
        targetType: 'user',
        targetId: user3.id,
        targetLabel: 'dewi@gmail.com',
        createdAt: ago(60),
      },
      {
        action: 'order.imei.created',
        category: 'ORDER',
        severity: 'SUCCESS',
        summary: 'Order IMEI baru: IMEI-2026-A1B2C3 — Samsung Galaxy S24 Ultra Unlock',
        actorId: user1.id,
        actorName: 'Siti Nurhaliza',
        actorEmail: 'siti@gmail.com',
        actorRole: 'USER',
        targetType: 'imei_order',
        targetLabel: 'IMEI-2026-A1B2C3',
        metadata: { orderCode: 'IMEI-2026-A1B2C3', amount: '150000' },
        createdAt: ago(90),
      },
      {
        action: 'order.imei.success',
        category: 'ORDER',
        severity: 'SUCCESS',
        summary: 'Order IMEI IMEI-2026-A1B2C3 berhasil',
        targetType: 'imei_order',
        targetLabel: 'IMEI-2026-A1B2C3',
        metadata: { orderCode: 'IMEI-2026-A1B2C3' },
        createdAt: ago(45),
      },
      {
        action: 'payment.deposit.manual',
        category: 'PAYMENT',
        severity: 'SUCCESS',
        summary: 'Admin deposit Rp 500.000 ke Siti Nurhaliza',
        actorId: admin.id,
        actorName: 'Admin IndoTeknizi',
        actorEmail: 'admin@indoteknizi.com',
        actorRole: 'ADMIN',
        targetType: 'user',
        targetId: user1.id,
        targetLabel: 'Siti Nurhaliza',
        metadata: { amount: 500000, method: 'manual' },
        createdAt: ago(120),
      },
      {
        action: 'account.password.changed',
        category: 'ACCOUNT',
        severity: 'SUCCESS',
        summary: 'Rudi Hartono mengganti password',
        actorId: user2.id,
        actorName: 'Rudi Hartono',
        actorEmail: 'rudi@gmail.com',
        actorRole: 'USER',
        targetType: 'user',
        targetId: user2.id,
        targetLabel: 'rudi@gmail.com',
        createdAt: ago(180),
      },
      {
        action: 'auth.login.failed',
        category: 'SECURITY',
        severity: 'WARNING',
        summary: 'Percobaan login gagal untuk hacker@test.com',
        actorEmail: 'hacker@test.com',
        ip: '45.33.32.156',
        userAgent: 'Mozilla/5.0 (compatible; bot)',
        metadata: { email: 'hacker@test.com' },
        createdAt: ago(10),
      },
      {
        action: 'auth.suspicious.brute_force',
        category: 'SECURITY',
        severity: 'CRITICAL',
        summary: 'Aktivitas mencurigakan: 6 percobaan login gagal dari hacker@test.com',
        detail: 'Threshold 5 percobaan dalam 15 menit terlampaui.\nEmail: hacker@test.com\nIP: 45.33.32.156',
        actorEmail: 'hacker@test.com',
        ip: '45.33.32.156',
        userAgent: 'Mozilla/5.0 (compatible; bot)',
        metadata: { email: 'hacker@test.com', attempts: 6, windowMinutes: 15 },
        createdAt: ago(8),
      },
      {
        action: 'auth.logout',
        category: 'AUTH',
        severity: 'INFO',
        summary: 'Budi Santoso logout',
        actorId: teknisi2.id,
        actorName: 'Budi Santoso',
        actorEmail: 'budi@indoteknizi.com',
        actorRole: 'TEKNISI',
        createdAt: ago(200),
      },
      {
        action: 'order.server.created',
        category: 'ORDER',
        severity: 'SUCCESS',
        summary: 'Order Server baru: SRV-2026-XYZ123 — Samsung FRP Remove',
        actorId: user2.id,
        actorName: 'Rudi Hartono',
        actorEmail: 'rudi@gmail.com',
        actorRole: 'USER',
        targetType: 'server_order',
        targetLabel: 'SRV-2026-XYZ123',
        metadata: { orderCode: 'SRV-2026-XYZ123', amount: '75000' },
        createdAt: ago(240),
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
