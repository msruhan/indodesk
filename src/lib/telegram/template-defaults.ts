export const TELEGRAM_EVENT_KEYS = [
  'product.published',
  'marketplace.order.new',
  'marketplace.order.paid',
  'marketplace.packaging.submitted',
  'konsultasi.new',
  'inspeksi.new',
] as const

export type TelegramEventKey = (typeof TELEGRAM_EVENT_KEYS)[number]

export type TelegramEventAudience = 'CHANNEL' | 'TEKNISI' | 'ADMIN'

export type TelegramEventDefinition = {
  eventKey: TelegramEventKey
  label: string
  description: string
  audience: TelegramEventAudience
  placeholders: readonly string[]
  defaultBody: string
  sampleVars: Record<string, string>
}

const PRODUCT_PUBLISHED_BODY = `🛍️ *Produk Baru di Marketplace!*

📦 {{namaProduk}}
💰 {{harga}}
🏪 Toko: {{namaToko}}
👤 Penjual: {{namaTeknisi}}
📱 Telegram: {{usernameTelegram}}

👉 {{linkProduk}}`

const ORDER_NEW_BODY = `🛒 *Pesanan Marketplace Baru*

👤 Pembeli: {{namaPembeli}}
📦 Produk: {{namaProduk}}
💵 Total: {{total}}
🔖 Kode: \`{{kodeOrder}}\`

Segera proses di dashboard:
{{linkPesanan}}`

const ORDER_PAID_BODY = `💳 *Pembayaran Diterima*

👤 Pembeli: {{namaPembeli}}
📦 Produk: {{namaProduk}}
💵 Total: {{total}}
🔖 Kode: \`{{kodeOrder}}\`

Silakan proses pesanan ini.
{{linkPesanan}}`

const KONSULTASI_NEW_BODY = `🔔 *Request Konsultasi Baru*

👤 {{namaUser}}
📋 Layanan: {{layanan}}
🔖 Kode: \`{{kodeSesi}}\`

Cek dashboard untuk terima/tolak:
{{linkDashboard}}`

const INSPEKSI_NEW_BODY = `🔔 *Request Inspeksi Baru*

👤 {{namaUser}}
📱 Produk: {{namaProduk}}
📍 Mode: {{mode}}
🔖 Kode: \`{{kodeOrder}}\`

Cek dashboard untuk menerima request:
{{linkDashboard}}`

const PACKAGING_SUBMITTED_BODY = `📦 *Bukti Packaging Menunggu Review*

🔖 Order: \`{{kodeOrder}}\`
👤 Penjual: {{namaPenjual}}
💵 Total: {{total}}
📎 File: {{jumlahFile}}

Review di dashboard admin:
{{linkReview}}`

export const TELEGRAM_EVENT_CATALOG: Record<TelegramEventKey, TelegramEventDefinition> = {
  'product.published': {
    eventKey: 'product.published',
    label: 'Produk dipublish',
    description: 'Broadcast ke channel saat iklan produk disetujui dan tampil di marketplace. Semua foto iklan dikirim sebagai album (maks. 10); caption dari template.',
    audience: 'CHANNEL',
    placeholders: [
      'namaProduk',
      'harga',
      'kategori',
      'namaToko',
      'namaTeknisi',
      'usernameTelegram',
      'linkProduk',
    ],
    defaultBody: PRODUCT_PUBLISHED_BODY,
    sampleVars: {
      namaProduk: 'iPhone 13 Pro 256GB',
      harga: 'Rp 8.500.000',
      kategori: 'Smartphone',
      namaToko: 'Ahmad Cell',
      namaTeknisi: 'Ahmad Teknisi',
      usernameTelegram: '@ahmad_teknisi',
      linkProduk: 'https://bantoo.in/marketplace/products/contoh',
    },
  },
  'marketplace.order.new': {
    eventKey: 'marketplace.order.new',
    label: 'Pesanan marketplace baru',
    description: 'Notifikasi ke teknisi penjual saat ada pesanan baru.',
    audience: 'TEKNISI',
    placeholders: [
      'kodeOrder',
      'namaProduk',
      'namaPembeli',
      'total',
      'jumlahItem',
      'metodeBayar',
      'linkPesanan',
    ],
    defaultBody: ORDER_NEW_BODY,
    sampleVars: {
      kodeOrder: 'ORD-2026-ABC123',
      namaProduk: 'Samsung Galaxy S23',
      namaPembeli: 'Budi Santoso',
      total: 'Rp 5.200.000',
      jumlahItem: '1',
      metodeBayar: 'wallet',
      linkPesanan: 'https://bantoo.in/teknisi/pesanan',
    },
  },
  'marketplace.order.paid': {
    eventKey: 'marketplace.order.paid',
    label: 'Pembayaran pesanan diterima',
    description: 'Notifikasi ke teknisi saat status pesanan berubah menjadi dibayar (gateway async).',
    audience: 'TEKNISI',
    placeholders: [
      'kodeOrder',
      'namaProduk',
      'namaPembeli',
      'total',
      'jumlahItem',
      'metodeBayar',
      'linkPesanan',
    ],
    defaultBody: ORDER_PAID_BODY,
    sampleVars: {
      kodeOrder: 'ORD-2026-ABC123',
      namaProduk: 'Samsung Galaxy S23',
      namaPembeli: 'Budi Santoso',
      total: 'Rp 5.200.000',
      jumlahItem: '1',
      metodeBayar: 'wallet',
      linkPesanan: 'https://bantoo.in/teknisi/pesanan',
    },
  },
  'marketplace.packaging.submitted': {
    eventKey: 'marketplace.packaging.submitted',
    label: 'Bukti packaging menunggu review',
    description:
      'Notifikasi ke grup/channel Telegram admin saat penjual mengirim bukti packaging marketplace.',
    audience: 'ADMIN',
    placeholders: ['kodeOrder', 'namaPenjual', 'total', 'jumlahFile', 'linkReview'],
    defaultBody: PACKAGING_SUBMITTED_BODY,
    sampleVars: {
      kodeOrder: 'ORD-2026-MSU5WN',
      namaPenjual: 'Masruhan Teknisi',
      total: 'Rp 10.000',
      jumlahFile: '2',
      linkReview: 'https://bantoo.in/admin/marketplace-packaging',
    },
  },
  'konsultasi.new': {
    eventKey: 'konsultasi.new',
    label: 'Konsultasi baru',
    description: 'Notifikasi ke teknisi saat ada request konsultasi baru.',
    audience: 'TEKNISI',
    placeholders: ['namaUser', 'layanan', 'kodeSesi', 'remoteId', 'linkDashboard'],
    defaultBody: KONSULTASI_NEW_BODY,
    sampleVars: {
      namaUser: 'Siti Rahayu',
      layanan: 'Konsultasi iPhone tidak bisa charge',
      kodeSesi: 'KON-2026-XYZ',
      remoteId: '123456789',
      linkDashboard: 'https://bantoo.in/teknisi/konsultasi',
    },
  },
  'inspeksi.new': {
    eventKey: 'inspeksi.new',
    label: 'Inspeksi baru',
    description: 'Notifikasi ke teknisi saat ada permintaan inspeksi baru.',
    audience: 'TEKNISI',
    placeholders: ['namaUser', 'namaProduk', 'mode', 'kodeOrder', 'linkDashboard'],
    defaultBody: INSPEKSI_NEW_BODY,
    sampleVars: {
      namaUser: 'Andi Wijaya',
      namaProduk: 'MacBook Pro 14 M2',
      mode: 'online',
      kodeOrder: 'INS-2026-DEF',
      linkDashboard: 'https://bantoo.in/teknisi/inspeksi',
    },
  },
}

export function isTelegramEventKey(value: string): value is TelegramEventKey {
  return (TELEGRAM_EVENT_KEYS as readonly string[]).includes(value)
}

export function getDefaultTemplate(eventKey: TelegramEventKey): TelegramEventDefinition {
  return TELEGRAM_EVENT_CATALOG[eventKey]
}

export function getEventAudience(eventKey: TelegramEventKey): TelegramEventAudience {
  return TELEGRAM_EVENT_CATALOG[eventKey].audience
}
