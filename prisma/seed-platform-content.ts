import type { PrismaClient } from '@prisma/client'
import { defaultMarketplaceBanners } from '../src/data/mock-marketplace-banners'
import { normalizeBannerPlacement } from '../src/lib/marketplace-banners'
import { DEFAULT_PLATFORM_SETTINGS } from '../src/lib/platform-settings'

const DEFAULT_HELP = [
  {
    audience: 'admin',
    question: 'Bagaimana cara approve produk?',
    answer: 'Pergi ke halaman Approval dan klik tombol Approve pada produk yang ingin disetujui.',
    sortOrder: 1,
  },
  {
    audience: 'admin',
    question: 'Bagaimana cara mengelola user?',
    answer: 'Gunakan halaman Manajemen User untuk melihat, edit, atau hapus user.',
    sortOrder: 2,
  },
  {
    audience: 'user',
    question: 'Bagaimana cara melakukan konsultasi?',
    answer: 'Pilih teknisi di halaman Teknisi, kemudian klik tombol Konsultasi Online.',
    sortOrder: 1,
  },
  {
    audience: 'user',
    question: 'Bagaimana cara menggunakan transaksi aman?',
    answer: 'Pergi ke halaman Transaksi Aman dan klik Ajukan Transaksi Aman untuk memulai transaksi dengan dana ditahan platform.',
    sortOrder: 2,
  },
  {
    audience: 'teknisi',
    question: 'Bagaimana menerima order konsultasi?',
    answer: 'Buka menu Konsultasi di dashboard teknisi. Sesi baru akan muncul saat user memesan.',
    sortOrder: 1,
  },
  {
    audience: 'teknisi',
    question: 'Bagaimana menarik saldo?',
    answer: 'Buka menu Saldo & Riwayat untuk melihat saldo dan riwayat transaksi wallet.',
    sortOrder: 2,
  },
] as const

export async function seedPlatformContent(prisma: PrismaClient) {
  await prisma.helpArticle.deleteMany()
  await prisma.platformSetting.deleteMany()
  await prisma.marketplaceBanner.deleteMany()

  const banners = defaultMarketplaceBanners.map((b) => {
    const banner = normalizeBannerPlacement(b)
    return {
      title: banner.title,
      subtitle: banner.subtitle,
      image: banner.image,
      link: banner.link,
      buttonText: banner.buttonText,
      active: banner.active,
      sortOrder: banner.sortOrder,
      placement: banner.placement,
    }
  })
  await prisma.marketplaceBanner.createMany({ data: banners })

  const s = DEFAULT_PLATFORM_SETTINGS
  await prisma.platformSetting.createMany({
    data: [
      { key: 'platform_name', value: s.platformName },
      { key: 'support_email', value: s.supportEmail },
      { key: 'support_phone', value: s.supportPhone },
      { key: 'admin_email', value: s.adminEmail },
      { key: 'buyer_fee_percent', value: String(s.buyerFeePercent) },
      { key: 'seller_fee_percent', value: String(s.sellerFeePercent) },
      { key: 'maintenance_mode', value: s.maintenanceMode ? 'true' : 'false' },
      {
        key: 'imei_service_enabled',
        value: s.imeiServiceEnabled ? 'true' : 'false',
      },
      {
        key: 'remote_service_enabled',
        value: s.remoteServiceEnabled ? 'true' : 'false',
      },
      {
        key: 'inspection_service_enabled',
        value: s.inspectionServiceEnabled ? 'true' : 'false',
      },
      {
        key: 'cari_teknisi_enabled',
        value: s.cariTeknisiEnabled ? 'true' : 'false',
      },
      {
        key: 'konsultasi_service_enabled',
        value: s.konsultasiServiceEnabled ? 'true' : 'false',
      },
      {
        key: 'rekber_service_enabled',
        value: s.rekberServiceEnabled ? 'true' : 'false',
      },
    ],
  })

  await prisma.helpArticle.createMany({
    data: DEFAULT_HELP.map((h) => ({ ...h, isActive: true })),
  })

  console.log(`   ✓ ${banners.length} marketplace banners`)
  console.log('   ✓ platform settings')
  console.log(`   ✓ ${DEFAULT_HELP.length} help articles`)
}
