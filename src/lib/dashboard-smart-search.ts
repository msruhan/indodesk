import type { UserRole } from '@prisma/client'
import {
  MARKETPLACE_PATH,
  accountPathForRole,
  chatPathForRole,
  homePathForRole,
} from '@/lib/role-routes'
import { USER_IMEI_ORDERS_PATH, userImeiOrdersHref } from '@/lib/user-imei-orders-path'

export type SmartSearchResultKind = 'quick' | 'order' | 'user' | 'product' | 'page'

export interface SmartSearchItem {
  id: string
  kind: SmartSearchResultKind
  label: string
  hint: string
  href: string
  /** Extra tokens for client-side filtering */
  keywords?: string[]
}

export interface SmartSearchApiResult {
  id: string
  kind: Exclude<SmartSearchResultKind, 'quick'>
  label: string
  hint: string
  href: string
}

function quick(
  id: string,
  label: string,
  hint: string,
  href: string,
  keywords: string[] = [],
): SmartSearchItem {
  const base = [label, hint, href, ...keywords]
  return { id: `quick-${id}`, kind: 'quick', label, hint, href, keywords: base }
}

/** Static shortcuts per role — filtered locally by query. */
export function quickActionsForRole(role: UserRole): SmartSearchItem[] {
  if (role === 'ADMIN') {
    return [
      quick('dashboard', 'Dashboard admin', 'Ringkasan platform', '/admin/dashboard', [
        'home',
        'overview',
      ]),
      quick('approval', 'Review approval', 'Produk, toko, dan teknisi pending', '/admin/approval', [
        'pending',
        'verifikasi',
      ]),
      quick('management', 'Management akun', 'User, teknisi, dan role', '/admin/management', [
        'user',
        'akun',
      ]),
      quick('imei', 'Digital & server', 'API supplier dan order masuk', '/admin/imei?tab=orders', [
        'order',
        'dhru',
        'unlock',
      ]),
      quick('produk', 'Services & produk', 'Katalog layanan platform', '/admin/produk', [
        'topup',
        'marketplace',
      ]),
      quick('rekber', 'Rekber / escrow', 'Transaksi ditahan', '/admin/rekber', ['escrow']),
      quick(
        'keuangan-marketplace',
        'Keuangan Marketplace',
        'Pengaturan & riwayat fee marketplace',
        '/admin/keuangan-marketplace',
        ['fee', 'marketplace'],
      ),
      quick(
        'pendapatan-platform',
        'Pendapatan Platform',
        'Fee owner semua kanal layanan',
        '/admin/pendapatan-platform',
        ['revenue', 'fee', 'pendapatan', 'platform', 'rekber', 'inspeksi'],
      ),
      quick('notif', 'Notifikasi In-App', 'Broadcast dan alert di aplikasi', '/admin/notifications', [
        'bell',
        'in-app',
      ]),
      quick('telegram', 'Notifikasi Telegram', 'Template notifikasi bot Telegram', '/admin/telegram-notifications', [
        'telegram',
        'bot',
      ]),
      quick('profil', 'Profil', 'Keamanan akun admin dan pengaturan platform', '/admin/settings', [
        'settings',
        'security',
        'akun',
      ]),
      quick('bantuan', 'Pusat Bantuan', 'Kelola FAQ untuk setiap peran', '/admin/help', [
        'help',
        'faq',
        'dukungan',
      ]),
      quick('market', 'Marketplace', 'Halaman depan publik', MARKETPLACE_PATH, ['beranda']),
    ]
  }

  if (role === 'TEKNISI') {
    return [
      quick('dashboard', 'Dashboard teknisi', 'Ringkasan performa', '/teknisi/dashboard', ['home']),
      quick('analitik', 'Analitik', 'Statistik toko dan layanan', '/teknisi/analitik', ['statistik']),
      quick('toko', 'Profil Toko', 'Kelola profil toko', '/teknisi/toko', ['store']),
      quick('produk', 'Iklan Produk', 'Kelola katalog produk', '/teknisi/produk', [
        'marketplace',
        'jual',
      ]),
      quick('iklan konsultasi', 'Iklan Konsultasi', 'Kelola paket konsultasi', '/teknisi/iklan-konsultasi', [
        'konsultasi',
        'layanan',
        'paket',
      ]),
      quick('pesanan masuk', 'Pesanan Masuk', 'Order marketplace dari pembeli', '/teknisi/pesanan', [
        'order',
        'pesanan',
        'resi',
      ]),
      quick('konsultasi', 'Konsultasi', 'Request dari pelanggan', '/teknisi/konsultasi', ['chat']),
      quick('inspeksi', 'Inspeksi', 'Permintaan inspeksi pra-beli', '/teknisi/inspeksi', ['cek']),
      quick('rekber', 'Rekber', 'Transaksi escrow', '/teknisi/rekber', ['escrow']),
      quick('belanja', 'Pesanan', 'Belanja sebagai pembeli', '/teknisi/orders', ['order', 'belanja']),
      quick('saldo', 'Riwayat Transaksi', 'Saldo, top up, dan tarik', '/teknisi/saldo', [
        'wallet',
        'transaksi',
      ]),
      quick('profil', 'Profil', 'Profil teknisi dan pengaturan', '/teknisi/settings', ['profil', 'akun', 'setting']),
      quick('bantuan', 'Pusat Bantuan', 'FAQ, tiket, dan kontak support', '/teknisi/bantuan', [
        'help',
        'support',
        'tiket',
      ]),
      quick('remote', 'Konsultasi remote', 'Sesi IndoDesk via konsultasi', '/teknisi/konsultasi?filter=remote', [
        'rustdesk',
        'remote',
        'indodesk',
      ]),
      quick('imei', 'Order perangkat (Digital)', 'Status order unlock', '/imei', [
        'imei',
        'unlock',
      ]),
      quick('server', 'Order server', 'Layanan server supplier', '/imei', [
        'server',
      ]),
      quick('market', 'Marketplace', 'Halaman depan', MARKETPLACE_PATH, ['beranda']),
    ]
  }

  return [
    quick('dashboard', 'Dashboard', 'Ringkasan akun', '/user/dashboard', ['home']),
    quick('pesanan', 'Pesanan', 'Marketplace, top up, digital & server', '/user/orders', [
      'order',
      'belanja',
      'shop',
    ]),
    quick('konsultasi', 'Konsultasi', 'Riwayat konsultasi teknisi', '/user/konsultasi', ['chat', 'remote']),
    quick('inspeksi', 'Inspeksi', 'Inspeksi pra-beli', '/user/inspeksi', ['cek', 'laporan']),
    quick('rekber', 'Rekber', 'Transaksi rekening bersama', '/user/rekber', ['escrow']),
    quick('riwayat', 'Riwayat transaksi', 'Semua order dan aktivitas', '/user/riwayat', [
      'order',
      'history',
    ]),
    quick('saldo', 'Saldo & riwayat', 'Dashboard dan top up', '/user/dashboard', ['wallet', 'topup', 'saldo']),
    quick('imei', 'Order perangkat (Digital)', 'Cek status unlock', USER_IMEI_ORDERS_PATH, ['imei']),
    quick('server', 'Order server', 'Layanan server', userImeiOrdersHref('server'), ['server']),
    quick('topup', 'Top up game', 'Beli voucher & diamond', '/topup', ['game', 'voucher']),
    quick('market', 'Marketplace', 'Belanja produk teknisi', MARKETPLACE_PATH, ['belanja', 'toko']),
    quick('profil', 'Profil', 'Profil dan keamanan', accountPathForRole('USER'), ['profile', 'akun']),
    quick('bantuan', 'Pusat Bantuan', 'FAQ, tiket, dan kontak support', '/user/bantuan', [
      'help',
      'support',
      'tiket',
    ]),
    quick('chat', 'Chat', 'Pesan dengan teknisi', chatPathForRole('USER'), ['pesan']),
    quick('beranda', 'Beranda', 'Halaman depan Bantoo', '/', ['home', 'landing']),
  ]
}

export function filterSmartSearchItems(
  items: SmartSearchItem[],
  query: string,
): SmartSearchItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((item) => {
    const haystack = [item.label, item.hint, item.href, ...(item.keywords ?? [])]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

export function mergeSearchResults(
  quickItems: SmartSearchItem[],
  apiItems: SmartSearchApiResult[],
  maxTotal = 12,
): Array<SmartSearchItem | SmartSearchApiResult> {
  const merged: Array<SmartSearchItem | SmartSearchApiResult> = [...quickItems]
  for (const r of apiItems) {
    if (merged.length >= maxTotal) break
    if (merged.some((x) => x.href === r.href && x.label === r.label)) continue
    merged.push(r)
  }
  return merged.slice(0, maxTotal)
}

export function homeDashboardHref(role: UserRole): string {
  return homePathForRole(role)
}
