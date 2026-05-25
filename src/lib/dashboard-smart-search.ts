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
      quick('imei', 'IMEI & server', 'API supplier dan order masuk', '/admin/imei?tab=orders', [
        'order',
        'dhru',
        'unlock',
      ]),
      quick('produk', 'Services & produk', 'Katalog layanan platform', '/admin/produk', [
        'topup',
        'marketplace',
      ]),
      quick('rekber', 'Rekber / escrow', 'Transaksi ditahan', '/admin/rekber', ['escrow']),
      quick('notif', 'Notifikasi', 'Broadcast dan alert', '/admin/notifications', ['bell']),
      quick('akun', 'Akun Saya', 'Profil, keamanan, dan 2FA', '/admin/settings', ['settings', 'security']),
      quick('market', 'Marketplace', 'Halaman depan publik', MARKETPLACE_PATH, ['beranda']),
    ]
  }

  if (role === 'TEKNISI') {
    return [
      quick('dashboard', 'Dashboard teknisi', 'Ringkasan performa', '/teknisi/dashboard', ['home']),
      quick('saldo', 'Saldo & transaksi', 'Top up dan riwayat', '/teknisi/saldo', [
        'wallet',
        'order',
      ]),
      quick('produk', 'Produk & software', 'Kelola katalog toko', '/teknisi/produk', [
        'marketplace',
        'jual',
      ]),
      quick('pesanan', 'Pesanan masuk', 'Order marketplace dari pembeli', '/teknisi/pesanan', [
        'order',
        'pesanan',
        'resi',
      ]),
      quick('konsultasi', 'Konsultasi', 'Request dari pelanggan', '/teknisi/konsultasi', ['chat']),
      quick('remote', 'Remote', 'Sesi remote aktif', '/teknisi/remote', ['rustdesk']),
      quick('imei', 'Order perangkat (IMEI)', 'Status order unlock', '/imei', [
        'imei',
        'unlock',
      ]),
      quick('server', 'Order server', 'Layanan server supplier', '/imei', [
        'server',
      ]),
      quick('akun', 'Akun Saya', 'Profil teknisi dan pengaturan akun', '/teknisi/settings', ['profil', 'akun', 'setting']),
      quick('market', 'Marketplace', 'Halaman depan', MARKETPLACE_PATH, ['beranda']),
    ]
  }

  return [
    quick('dashboard', 'Dashboard', 'Ringkasan akun', '/user/dashboard', ['home']),
    quick('riwayat', 'Riwayat transaksi', 'Semua order dan aktivitas', '/user/riwayat', [
      'order',
      'history',
    ]),
    quick('saldo', 'Saldo & riwayat', 'Dashboard dan top up', '/user/dashboard', ['wallet', 'topup', 'saldo']),
    quick('imei', 'Order perangkat (IMEI)', 'Cek status unlock', USER_IMEI_ORDERS_PATH, ['imei']),
    quick('server', 'Order server', 'Layanan server', userImeiOrdersHref('server'), ['server']),
    quick('topup', 'Top up game', 'Beli voucher & diamond', '/topup', ['game', 'voucher']),
    quick('market', 'Marketplace', 'Belanja produk teknisi', MARKETPLACE_PATH, ['belanja', 'toko']),
    quick('akun', 'Akun saya', 'Profil dan keamanan', accountPathForRole('USER'), ['profile']),
    quick('chat', 'Chat', 'Pesan dengan teknisi', chatPathForRole('USER'), ['pesan']),
    quick('beranda', 'Beranda', 'Halaman depan IndoTeknizi', '/', ['home', 'landing']),
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
