export const TELEGRAM_EVENT_KEYS = [
  'product.published',
  'marketplace.order.new',
  'marketplace.order.paid',
  'marketplace.packaging.submitted',
  'konsultasi.new',
  'inspeksi.new',
  'admin.user.registered',
  'admin.teknisi.registered',
  'admin.product.pending',
  'admin.marketplace.order.new',
  'admin.marketplace.order.paid',
  'admin.konsultasi.new',
  'admin.inspeksi.new',
  'admin.marketplace.packaging.submitted',
  'admin.withdraw.request',
] as const

export type TelegramEventKey = (typeof TELEGRAM_EVENT_KEYS)[number]

export type TelegramEventAudience = 'CHANNEL' | 'TEKNISI' | 'ADMIN' | 'ADMINS'

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
📝 {{deskripsiproduk}}
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

const ADMIN_USER_REGISTERED_BODY = `👤 *User Baru Mendaftar*

Nama: {{namaUser}}
📧 Email: {{email}}
📱 WhatsApp: {{telepon}}

Kelola di dashboard:
{{linkDashboard}}`

const ADMIN_TEKNISI_REGISTERED_BODY = `🔧 *Teknisi Baru Mendaftar*

Nama: {{namaTeknisi}}
📧 Email: {{email}}
📱 WhatsApp: {{telepon}}
📍 Kota: {{kota}}

Tinjau & setujui:
{{linkDashboard}}`

const ADMIN_PRODUCT_PENDING_BODY = `📋 *Iklan Produk Menunggu Approval*

📦 {{namaProduk}}
💰 {{harga}}
🏷️ {{kategori}}
🏪 Toko: {{namaToko}}
👤 Penjual: {{namaTeknisi}}
📝 {{ringkasan}}

Tinjau di antrian approval:
{{linkDashboard}}`

const ADMIN_ORDER_NEW_BODY = `🛒 *Pesanan Marketplace Baru*

👤 Pembeli: {{namaPembeli}}
🏪 Penjual: {{namaPenjual}}
📦 Produk: {{namaProduk}}
💵 Total: {{total}}
🔖 Kode: \`{{kodeOrder}}\`

{{linkDashboard}}`

const ADMIN_ORDER_PAID_BODY = `💳 *Pembayaran Pesanan Diterima*

👤 Pembeli: {{namaPembeli}}
🏪 Penjual: {{namaPenjual}}
📦 Produk: {{namaProduk}}
💵 Total: {{total}}
🔖 Kode: \`{{kodeOrder}}\`

{{linkDashboard}}`

const ADMIN_KONSULTASI_NEW_BODY = `🔔 *Request Konsultasi Baru*

👤 User: {{namaUser}}
👨‍🔧 Teknisi: {{namaTeknisi}}
📋 Layanan: {{layanan}}
🔖 Kode: \`{{kodeSesi}}\`

{{linkDashboard}}`

const ADMIN_INSPEKSI_NEW_BODY = `🔔 *Request Inspeksi Baru*

👤 User: {{namaUser}}
👨‍🔧 Teknisi: {{namaTeknisi}}
📱 Produk: {{namaProduk}}
📍 Mode: {{mode}}
🔖 Kode: \`{{kodeOrder}}\`

{{linkDashboard}}`

const ADMIN_PACKAGING_SUBMITTED_BODY = PACKAGING_SUBMITTED_BODY

const ADMIN_WITHDRAW_REQUEST_BODY = `💸 *Permintaan Tarik Saldo Baru*

👤 {{namaUser}} ({{role}})
📧 Email: {{email}}
💵 Jumlah: {{jumlah}}
🏦 Bank: {{bank}}
🔢 Rekening: {{rekening}}
👤 Atas nama: {{atasNama}}
⚠️ Risk score: {{riskScore}}

Proses di Manajemen → Saldo → Penarikan:
{{linkDashboard}}`

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
      'deskripsiproduk',
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
      deskripsiproduk: 'Kondisi mulus 98%, baterai 87%, Face ID normal, bebas iCloud.',
      namaToko: 'Ahmad Cell',
      namaTeknisi: 'Ahmad Teknisi',
      usernameTelegram: '@ahmad_teknisi',
      linkProduk: 'https://bantoo.in/marketplace/contoh',
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
  'admin.user.registered': {
    eventKey: 'admin.user.registered',
    label: 'User baru mendaftar',
    description: 'Notifikasi pribadi ke admin saat ada pendaftaran user baru.',
    audience: 'ADMINS',
    placeholders: ['namaUser', 'email', 'telepon', 'linkDashboard'],
    defaultBody: ADMIN_USER_REGISTERED_BODY,
    sampleVars: {
      namaUser: 'Budi Santoso',
      email: 'budi@example.com',
      telepon: '08123456789',
      linkDashboard: 'https://bantoo.in/admin/management',
    },
  },
  'admin.teknisi.registered': {
    eventKey: 'admin.teknisi.registered',
    label: 'Teknisi baru mendaftar',
    description: 'Notifikasi pribadi ke admin saat ada pendaftaran teknisi baru.',
    audience: 'ADMINS',
    placeholders: ['namaTeknisi', 'email', 'telepon', 'kota', 'linkDashboard'],
    defaultBody: ADMIN_TEKNISI_REGISTERED_BODY,
    sampleVars: {
      namaTeknisi: 'Ahmad Teknisi',
      email: 'ahmad@example.com',
      telepon: '08198765432',
      kota: 'Jakarta Selatan',
      linkDashboard: 'https://bantoo.in/admin/approval',
    },
  },
  'admin.product.pending': {
    eventKey: 'admin.product.pending',
    label: 'Iklan produk menunggu approval',
    description:
      'Notifikasi pribadi ke admin saat teknisi mengirim iklan produk baru atau perubahan yang perlu ditinjau.',
    audience: 'ADMINS',
    placeholders: [
      'namaProduk',
      'harga',
      'kategori',
      'namaToko',
      'namaTeknisi',
      'ringkasan',
      'linkDashboard',
    ],
    defaultBody: ADMIN_PRODUCT_PENDING_BODY,
    sampleVars: {
      namaProduk: 'iPhone 15 Pro 256GB',
      harga: 'Rp 15.000.000',
      kategori: 'iPhone',
      namaToko: 'Toko Teknisi',
      namaTeknisi: 'Ahmad Teknisi',
      ringkasan: 'Iklan produk baru',
      linkDashboard: 'https://bantoo.in/admin/approval',
    },
  },
  'admin.marketplace.order.new': {
    eventKey: 'admin.marketplace.order.new',
    label: 'Pesanan marketplace baru (admin)',
    description: 'Notifikasi pribadi ke admin saat ada pesanan marketplace baru.',
    audience: 'ADMINS',
    placeholders: [
      'kodeOrder',
      'namaProduk',
      'namaPembeli',
      'namaPenjual',
      'total',
      'linkDashboard',
    ],
    defaultBody: ADMIN_ORDER_NEW_BODY,
    sampleVars: {
      kodeOrder: 'ORD-2026-ABC123',
      namaProduk: 'Samsung Galaxy S23',
      namaPembeli: 'Budi Santoso',
      namaPenjual: 'Ahmad Cell',
      total: 'Rp 5.200.000',
      linkDashboard: 'https://bantoo.in/admin/transactions',
    },
  },
  'admin.marketplace.order.paid': {
    eventKey: 'admin.marketplace.order.paid',
    label: 'Pembayaran pesanan (admin)',
    description: 'Notifikasi pribadi ke admin saat pembayaran pesanan marketplace diterima.',
    audience: 'ADMINS',
    placeholders: [
      'kodeOrder',
      'namaProduk',
      'namaPembeli',
      'namaPenjual',
      'total',
      'linkDashboard',
    ],
    defaultBody: ADMIN_ORDER_PAID_BODY,
    sampleVars: {
      kodeOrder: 'ORD-2026-ABC123',
      namaProduk: 'Samsung Galaxy S23',
      namaPembeli: 'Budi Santoso',
      namaPenjual: 'Ahmad Cell',
      total: 'Rp 5.200.000',
      linkDashboard: 'https://bantoo.in/admin/transactions',
    },
  },
  'admin.konsultasi.new': {
    eventKey: 'admin.konsultasi.new',
    label: 'Konsultasi baru (admin)',
    description: 'Notifikasi pribadi ke admin saat ada request konsultasi baru.',
    audience: 'ADMINS',
    placeholders: ['namaUser', 'namaTeknisi', 'layanan', 'kodeSesi', 'linkDashboard'],
    defaultBody: ADMIN_KONSULTASI_NEW_BODY,
    sampleVars: {
      namaUser: 'Siti Rahayu',
      namaTeknisi: 'Ahmad Teknisi',
      layanan: 'Konsultasi iPhone tidak bisa charge',
      kodeSesi: 'KON-2026-XYZ',
      linkDashboard: 'https://bantoo.in/admin/monitoring?tab=konsultasi',
    },
  },
  'admin.inspeksi.new': {
    eventKey: 'admin.inspeksi.new',
    label: 'Inspeksi baru (admin)',
    description: 'Notifikasi pribadi ke admin saat ada permintaan inspeksi baru.',
    audience: 'ADMINS',
    placeholders: ['namaUser', 'namaTeknisi', 'namaProduk', 'mode', 'kodeOrder', 'linkDashboard'],
    defaultBody: ADMIN_INSPEKSI_NEW_BODY,
    sampleVars: {
      namaUser: 'Andi Wijaya',
      namaTeknisi: 'Ahmad Teknisi',
      namaProduk: 'MacBook Pro 14 M2',
      mode: 'online',
      kodeOrder: 'INS-2026-DEF',
      linkDashboard: 'https://bantoo.in/admin/inspeksi',
    },
  },
  'admin.marketplace.packaging.submitted': {
    eventKey: 'admin.marketplace.packaging.submitted',
    label: 'Bukti packaging (admin pribadi)',
    description:
      'Notifikasi pribadi ke admin saat penjual mengirim bukti packaging (selain broadcast ke grup/channel).',
    audience: 'ADMINS',
    placeholders: ['kodeOrder', 'namaPenjual', 'total', 'jumlahFile', 'linkReview'],
    defaultBody: ADMIN_PACKAGING_SUBMITTED_BODY,
    sampleVars: {
      kodeOrder: 'ORD-2026-MSU5WN',
      namaPenjual: 'Masruhan Teknisi',
      total: 'Rp 10.000',
      jumlahFile: '2',
      linkReview: 'https://bantoo.in/admin/marketplace-packaging',
    },
  },
  'admin.withdraw.request': {
    eventKey: 'admin.withdraw.request',
    label: 'Permintaan tarik saldo',
    description:
      'Notifikasi pribadi ke admin saat user/teknisi mengajukan penarikan saldo wallet.',
    audience: 'ADMINS',
    placeholders: [
      'namaUser',
      'role',
      'email',
      'jumlah',
      'bank',
      'rekening',
      'atasNama',
      'riskScore',
      'linkDashboard',
    ],
    defaultBody: ADMIN_WITHDRAW_REQUEST_BODY,
    sampleVars: {
      namaUser: 'Masruhan',
      role: 'Teknisi',
      email: 'masruhan@example.com',
      jumlah: 'Rp 100.000',
      bank: 'BCA',
      rekening: '1234567890',
      atasNama: 'Masruhan',
      riskScore: '40',
      linkDashboard: 'https://bantoo.in/admin/management?tab=saldo&subtab=withdraw',
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
