import type {
  PaymentMethod,
  TopupCategory,
  TopupDenomination,
  TopupProduct,
} from './topup-types'

/* -------------------------------------------------------------------------- */
/* CATEGORIES                                                                 */
/* -------------------------------------------------------------------------- */

export const topupCategories: TopupCategory[] = [
  { slug: 'mobile-game', label: 'Mobile Game', icon: 'gamepad' },
  { slug: 'pc-game', label: 'PC Game', icon: 'desktop' },
  { slug: 'voucher', label: 'Voucher', icon: 'voucher' },
  { slug: 'pulsa', label: 'Pulsa', icon: 'phone' },
  { slug: 'paket-data', label: 'Paket Data', icon: 'wifi' },
  { slug: 'streaming', label: 'Streaming', icon: 'play' },
]

/* -------------------------------------------------------------------------- */
/* PRODUCTS                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Cover and logo art are sourced from public CDNs (Steam, official press kits,
 * Wikipedia commons). Replace freely with licensed assets for production.
 */
export const topupProducts: TopupProduct[] = [
  {
    slug: 'mobile-legends',
    category: 'mobile-game',
    name: 'Mobile Legends',
    publisher: 'Moonton',
    logo: 'https://cdn.moonton.com/sites/default/files/styles/news_thumbnail/public/2024-09/MLBB%20Logo.png',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&h=900&fit=crop',
    accent: 'from-indigo-500/30 via-purple-500/15 to-transparent',
    description:
      'Top up Diamonds & Weekly Diamond Pass instan untuk Mobile Legends: Bang Bang. Proses otomatis 24/7, cukup masukkan User ID & Server ID kamu.',
    rating: 4.9,
    ratingCount: 21_604_000,
    ordersToday: 8420,
    isHot: true,
    idLabel: 'User ID',
    serverLabel: 'Server ID',
    idHelp: 'Cek di profil game, format: 12345678 (1234) — angka di dalam kurung adalah Server ID.',
  },
  {
    slug: 'free-fire',
    category: 'mobile-game',
    name: 'Free Fire',
    publisher: 'Garena',
    logo: 'https://cdn-gop.garenanow.com/webmain/static/2023/ff/ff-logo.png',
    cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1600&h=900&fit=crop',
    accent: 'from-orange-500/30 via-red-500/15 to-transparent',
    description:
      'Top up Diamonds Free Fire & Free Fire Max secara instan dengan harga termurah. Tanpa login, cukup User ID.',
    rating: 4.9,
    ratingCount: 12_350_000,
    ordersToday: 6210,
    isHot: true,
    idLabel: 'User ID',
    idHelp: 'User ID tertera di pojok kanan atas profil Free Fire kamu.',
  },
  {
    slug: 'pubg-mobile',
    category: 'mobile-game',
    name: 'PUBG Mobile',
    publisher: 'Tencent Games',
    logo: 'https://cdn.midasbuy.com/oi/imgname/c069c95fcf57414bbe7adb4adff79bfb.png',
    cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&h=900&fit=crop',
    accent: 'from-amber-500/25 via-orange-500/15 to-transparent',
    description:
      'Top up UC PUBG Mobile aman & cepat. Proses otomatis, langsung masuk ke akun PUBG kamu dalam hitungan detik.',
    rating: 4.8,
    ratingCount: 9_120_000,
    ordersToday: 3980,
    idLabel: 'PUBG ID',
    idHelp: 'PUBG ID adalah angka 10–11 digit, bukan nickname.',
  },
  {
    slug: 'genshin-impact',
    category: 'mobile-game',
    name: 'Genshin Impact',
    publisher: 'HoYoverse',
    logo: 'https://upload-os-bbs.hoyolab.com/upload/2023/01/16/116245484/06f1d4c0c4c4e76b1b0b0a47cf6d8e3a_3625089127820810056.png',
    cover: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1600&h=900&fit=crop',
    accent: 'from-cyan-500/25 via-blue-500/15 to-transparent',
    description:
      'Genesis Crystals & Blessing of the Welkin Moon — top up untuk Genshin Impact dengan rate terbaik dan delivery instan.',
    rating: 4.9,
    ratingCount: 5_180_000,
    ordersToday: 2140,
    idLabel: 'UID',
    serverLabel: 'Server',
    idHelp: 'UID di pojok kanan bawah game. Pilih server: Asia / America / Europe / TW-HK-MO.',
  },
  {
    slug: 'honor-of-kings',
    category: 'mobile-game',
    name: 'Honor of Kings',
    publisher: 'Tencent Games',
    logo: 'https://upload.wikimedia.org/wikipedia/en/2/2c/Honor_of_Kings_logo.png',
    cover: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=1600&h=900&fit=crop',
    accent: 'from-rose-500/25 via-pink-500/15 to-transparent',
    description:
      'Top up Tokens Honor of Kings global. Proses cepat, harga transparan, dan support 24 jam.',
    rating: 4.8,
    ratingCount: 1_780_000,
    ordersToday: 980,
    isHot: true,
    idLabel: 'Player ID',
    serverLabel: 'Server',
    idHelp: 'Player ID di Settings > Account. Pilih server sesuai region kamu.',
  },
  {
    slug: 'magic-chess-go-go',
    category: 'mobile-game',
    name: 'Magic Chess: Go Go',
    publisher: 'Moonton',
    logo: 'https://cdn.moonton.com/sites/default/files/styles/news_thumbnail/public/2024-09/MLBB%20Logo.png',
    cover: 'https://images.unsplash.com/photo-1606503153255-59d8b8b54a3a?w=1600&h=900&fit=crop',
    accent: 'from-violet-500/30 via-fuchsia-500/15 to-transparent',
    description:
      'Top up Magic Chess: Go Go untuk pengguna Indonesia. Tersedia paket Magic Tickets dan Pass eksklusif.',
    rating: 4.7,
    ratingCount: 220_000,
    ordersToday: 540,
    idLabel: 'User ID',
    serverLabel: 'Server ID',
    idHelp: 'Sama seperti Mobile Legends — User ID & Server ID di profil game.',
  },
  {
    slug: 'valorant',
    category: 'pc-game',
    name: 'Valorant',
    publisher: 'Riot Games',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_pink_color_version.svg/1200px-Valorant_logo_-_pink_color_version.svg.png',
    cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1600&h=900&fit=crop',
    accent: 'from-rose-500/30 via-red-500/15 to-transparent',
    description:
      'Top up Valorant Points (VP) & Radianite. Proses instan via Riot ID, pembayaran aman terjamin.',
    rating: 4.8,
    ratingCount: 480_000,
    ordersToday: 720,
    idLabel: 'Riot ID',
    idHelp: 'Riot ID + Tag (contoh: PlayerOne#NA1). Region akan terdeteksi otomatis.',
  },
  {
    slug: 'pulsa-telkomsel',
    category: 'pulsa',
    name: 'Telkomsel',
    publisher: 'Telkomsel',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Telkomsel_2021_icon.svg/1200px-Telkomsel_2021_icon.svg.png',
    cover: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1600&h=900&fit=crop',
    accent: 'from-red-500/25 via-orange-500/15 to-transparent',
    description: 'Pulsa reguler Telkomsel — Simpati, As, Loop. Proses otomatis 24/7.',
    rating: 4.9,
    ratingCount: 980_000,
    ordersToday: 5430,
    idLabel: 'Nomor Handphone',
    idHelp: 'Format: 0812xxxxxxxx atau 62812xxxxxxxx.',
  },
  {
    slug: 'pulsa-xl',
    category: 'pulsa',
    name: 'XL Axiata',
    publisher: 'XL Axiata',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/XL_Axiata_logo.svg/1200px-XL_Axiata_logo.svg.png',
    cover: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&h=900&fit=crop',
    accent: 'from-blue-500/25 via-cyan-500/15 to-transparent',
    description: 'Pulsa XL & XL Prio reguler. Auto-process, tinggal masukkan nomor.',
    rating: 4.9,
    ratingCount: 540_000,
    ordersToday: 1820,
    idLabel: 'Nomor Handphone',
    idHelp: 'Format: 0817xxxxxxxx atau 0818/0819/0859/0877/0878.',
  },
  {
    slug: 'voucher-google-play',
    category: 'voucher',
    name: 'Google Play',
    publisher: 'Google',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Google_Play_Arrow_logo.svg/1200px-Google_Play_Arrow_logo.svg.png',
    cover: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&h=900&fit=crop',
    accent: 'from-emerald-500/25 via-teal-500/15 to-transparent',
    description: 'Voucher Google Play untuk top up game, beli aplikasi, & langganan Google.',
    rating: 4.9,
    ratingCount: 320_000,
    ordersToday: 1240,
    idLabel: 'Email Penerima',
    idHelp: 'Voucher code akan dikirim via email. Pastikan email aktif dan valid.',
  },
  {
    slug: 'spotify',
    category: 'streaming',
    name: 'Spotify Premium',
    publisher: 'Spotify',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/1200px-Spotify_logo_without_text.svg.png',
    cover: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=1600&h=900&fit=crop',
    accent: 'from-emerald-500/30 via-green-500/15 to-transparent',
    description: 'Spotify Premium 1 / 3 / 6 / 12 bulan. Aktivasi instan ke akun kamu.',
    rating: 4.9,
    ratingCount: 180_000,
    ordersToday: 410,
    idLabel: 'Email Spotify',
    idHelp: 'Email yang terdaftar di akun Spotify kamu.',
  },
  {
    slug: 'netflix',
    category: 'streaming',
    name: 'Netflix',
    publisher: 'Netflix',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1200px-Netflix_2015_logo.svg.png',
    cover: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1600&h=900&fit=crop',
    accent: 'from-red-500/30 via-rose-500/15 to-transparent',
    description: 'Voucher Netflix mobile, basic, standard, & premium. Aktivasi 1 menit.',
    rating: 4.8,
    ratingCount: 95_000,
    ordersToday: 280,
    idLabel: 'Email Netflix',
    idHelp: 'Email yang terdaftar di akun Netflix.',
  },
]

/* -------------------------------------------------------------------------- */
/* DENOMINATIONS                                                              */
/* -------------------------------------------------------------------------- */

/** Helper to build flash sale ending in N hours from now. */
const flashIn = (hours: number) =>
  new Date(Date.now() + hours * 3_600_000).toISOString()

export const topupDenominations: TopupDenomination[] = [
  // --- Mobile Legends ---
  {
    sku: 'ml-weekly',
    productSlug: 'mobile-legends',
    group: 'Membership',
    label: 'Weekly Diamond Pass',
    note: '7 hari · 200 Diamond',
    basePrice: 27_777,
    salePrice: 23_999,
    badge: 'FLASH',
    flashSale: { sold: 87, quota: 100, endsAt: flashIn(6) },
  },
  {
    sku: 'ml-86',
    productSlug: 'mobile-legends',
    group: 'Diamonds',
    label: '86 Diamonds',
    note: '78 + 8 bonus',
    basePrice: 22_500,
    badge: 'POPULAR',
  },
  { sku: 'ml-172', productSlug: 'mobile-legends', group: 'Diamonds', label: '172 Diamonds', note: '156 + 16 bonus', basePrice: 44_500 },
  {
    sku: 'ml-257',
    productSlug: 'mobile-legends',
    group: 'Diamonds',
    label: '257 Diamonds',
    note: '234 + 23 bonus',
    basePrice: 66_000,
    salePrice: 61_500,
    badge: 'HEMAT',
  },
  { sku: 'ml-344', productSlug: 'mobile-legends', group: 'Diamonds', label: '344 Diamonds', note: '312 + 32 bonus', basePrice: 88_500 },
  {
    sku: 'ml-518',
    productSlug: 'mobile-legends',
    group: 'Diamonds',
    label: '518 Diamonds',
    note: '467 + 51 bonus',
    basePrice: 138_888,
    salePrice: 132_000,
    flashSale: { sold: 42, quota: 80, endsAt: flashIn(12) },
    badge: 'FLASH',
  },
  { sku: 'ml-706', productSlug: 'mobile-legends', group: 'Diamonds', label: '706 Diamonds', note: '636 + 70 bonus', basePrice: 175_500 },
  { sku: 'ml-1050', productSlug: 'mobile-legends', group: 'Diamonds', label: '1050 Diamonds', note: '946 + 104 bonus', basePrice: 274_444 },
  { sku: 'ml-2195', productSlug: 'mobile-legends', group: 'Diamonds', label: '2195 Diamonds', note: '1980 + 215 bonus', basePrice: 549_000 },
  { sku: 'ml-3688', productSlug: 'mobile-legends', group: 'Diamonds', label: '3688 Diamonds', note: '3328 + 360 bonus', basePrice: 879_000 },

  // --- Free Fire ---
  {
    sku: 'ff-membership-weekly',
    productSlug: 'free-fire',
    group: 'Membership',
    label: 'Weekly Membership',
    note: '450 Diamonds + bonus harian',
    basePrice: 32_000,
    salePrice: 28_500,
    badge: 'POPULAR',
  },
  { sku: 'ff-50', productSlug: 'free-fire', group: 'Diamonds', label: '50 Diamonds', basePrice: 7_900 },
  { sku: 'ff-100', productSlug: 'free-fire', group: 'Diamonds', label: '100 Diamonds', basePrice: 14_500 },
  {
    sku: 'ff-210',
    productSlug: 'free-fire',
    group: 'Diamonds',
    label: '210 Diamonds',
    basePrice: 30_000,
    salePrice: 27_900,
    badge: 'HEMAT',
  },
  { sku: 'ff-355', productSlug: 'free-fire', group: 'Diamonds', label: '355 Diamonds', basePrice: 49_500 },
  {
    sku: 'ff-720',
    productSlug: 'free-fire',
    group: 'Diamonds',
    label: '720 Diamonds',
    basePrice: 99_000,
    flashSale: { sold: 64, quota: 120, endsAt: flashIn(8) },
    badge: 'FLASH',
  },
  { sku: 'ff-1450', productSlug: 'free-fire', group: 'Diamonds', label: '1450 Diamonds', basePrice: 195_000 },
  { sku: 'ff-2530', productSlug: 'free-fire', group: 'Diamonds', label: '2530 Diamonds', basePrice: 339_000 },

  // --- PUBG Mobile ---
  { sku: 'pubg-60', productSlug: 'pubg-mobile', group: 'UC', label: '60 UC', basePrice: 14_500 },
  { sku: 'pubg-325', productSlug: 'pubg-mobile', group: 'UC', label: '325 UC', basePrice: 71_000, badge: 'POPULAR' },
  {
    sku: 'pubg-660',
    productSlug: 'pubg-mobile',
    group: 'UC',
    label: '660 UC',
    basePrice: 142_000,
    salePrice: 134_500,
    badge: 'HEMAT',
  },
  { sku: 'pubg-1800', productSlug: 'pubg-mobile', group: 'UC', label: '1800 UC', basePrice: 379_000 },
  { sku: 'pubg-3850', productSlug: 'pubg-mobile', group: 'UC', label: '3850 UC', basePrice: 730_000 },

  // --- Genshin ---
  { sku: 'gi-60', productSlug: 'genshin-impact', group: 'Genesis Crystal', label: '60 Genesis Crystals', basePrice: 16_000 },
  { sku: 'gi-330', productSlug: 'genshin-impact', group: 'Genesis Crystal', label: '300 + 30 Genesis Crystals', basePrice: 79_000, badge: 'POPULAR' },
  {
    sku: 'gi-1090',
    productSlug: 'genshin-impact',
    group: 'Genesis Crystal',
    label: '980 + 110 Genesis Crystals',
    basePrice: 245_000,
    salePrice: 229_000,
    badge: 'HEMAT',
  },
  { sku: 'gi-welkin', productSlug: 'genshin-impact', group: 'Membership', label: 'Blessing of the Welkin Moon', note: '30 hari', basePrice: 79_000 },

  // --- Honor of Kings ---
  { sku: 'hok-90', productSlug: 'honor-of-kings', group: 'Tokens', label: '90 Tokens', basePrice: 15_000 },
  { sku: 'hok-450', productSlug: 'honor-of-kings', group: 'Tokens', label: '450 Tokens', basePrice: 75_000, badge: 'POPULAR' },
  { sku: 'hok-900', productSlug: 'honor-of-kings', group: 'Tokens', label: '900 Tokens', basePrice: 149_000 },

  // --- Magic Chess ---
  { sku: 'mc-60', productSlug: 'magic-chess-go-go', group: 'Tickets', label: '60 Magic Tickets', basePrice: 15_000 },
  { sku: 'mc-300', productSlug: 'magic-chess-go-go', group: 'Tickets', label: '300 Magic Tickets', basePrice: 75_000 },
  { sku: 'mc-pass', productSlug: 'magic-chess-go-go', group: 'Membership', label: 'Magic Pass', note: '14 hari', basePrice: 49_000, badge: 'POPULAR' },

  // --- Valorant ---
  { sku: 'val-475', productSlug: 'valorant', group: 'VP', label: '475 Valorant Points', basePrice: 65_000 },
  { sku: 'val-1000', productSlug: 'valorant', group: 'VP', label: '1000 Valorant Points', basePrice: 135_000, badge: 'POPULAR' },
  { sku: 'val-2050', productSlug: 'valorant', group: 'VP', label: '2050 Valorant Points', basePrice: 269_000 },

  // --- Pulsa Telkomsel ---
  { sku: 'tsel-5k', productSlug: 'pulsa-telkomsel', group: 'Pulsa', label: 'Pulsa Rp 5.000', basePrice: 6_500 },
  { sku: 'tsel-10k', productSlug: 'pulsa-telkomsel', group: 'Pulsa', label: 'Pulsa Rp 10.000', basePrice: 11_500, badge: 'POPULAR' },
  { sku: 'tsel-20k', productSlug: 'pulsa-telkomsel', group: 'Pulsa', label: 'Pulsa Rp 20.000', basePrice: 21_000 },
  { sku: 'tsel-50k', productSlug: 'pulsa-telkomsel', group: 'Pulsa', label: 'Pulsa Rp 50.000', basePrice: 50_500, salePrice: 49_500, badge: 'HEMAT' },
  { sku: 'tsel-100k', productSlug: 'pulsa-telkomsel', group: 'Pulsa', label: 'Pulsa Rp 100.000', basePrice: 100_500 },

  // --- Pulsa XL ---
  { sku: 'xl-5k', productSlug: 'pulsa-xl', group: 'Pulsa', label: 'Pulsa Rp 5.000', basePrice: 6_300 },
  { sku: 'xl-10k', productSlug: 'pulsa-xl', group: 'Pulsa', label: 'Pulsa Rp 10.000', basePrice: 11_200, badge: 'POPULAR' },
  { sku: 'xl-25k', productSlug: 'pulsa-xl', group: 'Pulsa', label: 'Pulsa Rp 25.000', basePrice: 25_500 },
  { sku: 'xl-50k', productSlug: 'pulsa-xl', group: 'Pulsa', label: 'Pulsa Rp 50.000', basePrice: 50_500 },

  // --- Google Play ---
  { sku: 'gp-50k', productSlug: 'voucher-google-play', group: 'Voucher', label: 'Voucher Rp 50.000', basePrice: 51_500 },
  { sku: 'gp-100k', productSlug: 'voucher-google-play', group: 'Voucher', label: 'Voucher Rp 100.000', basePrice: 102_000, badge: 'POPULAR' },
  { sku: 'gp-150k', productSlug: 'voucher-google-play', group: 'Voucher', label: 'Voucher Rp 150.000', basePrice: 152_500 },
  { sku: 'gp-300k', productSlug: 'voucher-google-play', group: 'Voucher', label: 'Voucher Rp 300.000', basePrice: 304_000 },

  // --- Spotify ---
  { sku: 'spo-1', productSlug: 'spotify', group: 'Premium', label: 'Premium Individual 1 Bulan', basePrice: 54_990 },
  { sku: 'spo-3', productSlug: 'spotify', group: 'Premium', label: 'Premium Individual 3 Bulan', basePrice: 159_000, badge: 'HEMAT' },
  { sku: 'spo-12', productSlug: 'spotify', group: 'Premium', label: 'Premium Individual 12 Bulan', basePrice: 599_000, badge: 'POPULAR' },

  // --- Netflix ---
  { sku: 'nf-mobile', productSlug: 'netflix', group: 'Voucher', label: 'Mobile Plan 1 Bulan', basePrice: 54_000 },
  { sku: 'nf-basic', productSlug: 'netflix', group: 'Voucher', label: 'Basic Plan 1 Bulan', basePrice: 65_000, badge: 'POPULAR' },
  { sku: 'nf-standard', productSlug: 'netflix', group: 'Voucher', label: 'Standard Plan 1 Bulan', basePrice: 120_000 },
  { sku: 'nf-premium', productSlug: 'netflix', group: 'Voucher', label: 'Premium Plan 1 Bulan', basePrice: 186_000 },
]

/* -------------------------------------------------------------------------- */
/* PAYMENT METHODS                                                            */
/* -------------------------------------------------------------------------- */

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'saldo',
    kind: 'saldo',
    label: 'Saldo Bantoo',
    hint: 'Cashback 1% · Auto-confirm',
    fee: 0,
    instant: true,
  },
  {
    id: 'qris',
    kind: 'qris',
    label: 'QRIS',
    hint: 'GoPay, OVO, DANA, ShopeePay, semua e-wallet',
    fee: 0,
  },
  {
    id: 'gopay',
    kind: 'ewallet',
    label: 'GoPay',
    hint: 'Direct payment GoPay',
    fee: 1_500,
  },
  {
    id: 'dana',
    kind: 'ewallet',
    label: 'DANA',
    hint: 'Direct payment DANA',
    fee: 1_500,
  },
  {
    id: 'va-bca',
    kind: 'va',
    label: 'BCA Virtual Account',
    hint: 'Transfer manual via m-BCA / Klikbca',
    fee: 4_500,
  },
  {
    id: 'va-mandiri',
    kind: 'va',
    label: 'Mandiri Virtual Account',
    hint: 'Transfer manual via Livin / ATM',
    fee: 4_500,
  },
  {
    id: 'cc',
    kind: 'bank',
    label: 'Kartu Kredit / Debit',
    hint: 'Visa, Mastercard, JCB',
    fee: 5_000,
    disabled: true,
    disabledReason: 'Sedang maintenance',
  },
]

/* -------------------------------------------------------------------------- */
/* VALID PROMO CODES (demo)                                                   */
/* -------------------------------------------------------------------------- */

export const promoCodes: Record<
  string,
  { type: 'percent' | 'fixed'; value: number; label: string }
> = {
  TEKNIZI10: { type: 'percent', value: 10, label: 'Diskon 10%' },
  HEMAT5K: { type: 'fixed', value: 5_000, label: 'Potongan Rp 5.000' },
  NEWUSER: { type: 'fixed', value: 10_000, label: 'New user — Rp 10.000' },
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

export const findProduct = (slug: string) =>
  topupProducts.find((p) => p.slug === slug)

export const denominationsOf = (slug: string) =>
  topupDenominations.filter((d) => d.productSlug === slug)

export const findDenomination = (sku: string) =>
  topupDenominations.find((d) => d.sku === sku)

export const flashSaleDenominations = topupDenominations.filter((d) => d.flashSale)

export const popularProducts = topupProducts.filter((p) => p.isHot)
