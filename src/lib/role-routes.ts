import type { UserRole } from '@prisma/client'
import type { IconType } from '@/lib/icons-types'
import type { UserNavHomeMode } from '@/lib/user-nav-home'
import {
  isTeknisiWorkspaceZone,
  shouldTeknisiDashboardFirstSlot,
  type TeknisiNavHomeMode,
} from '@/lib/teknisi-nav-home'
import { isUserDashboardZone } from '@/lib/user-nav-home'

export const MARKETPLACE_PATH = '/marketplace'
export const TEKNISI_PUBLIC_PROFILE_PATH = '/teknisi/profil'

/** Dashboard home for each role — used when blocking cross-role access. */
export function homePathForRole(role: UserRole): string {
  if (role === 'ADMIN') return '/admin/dashboard'
  if (role === 'TEKNISI') return '/teknisi/dashboard'
  return '/user/dashboard'
}

export function chatPathForRole(role: UserRole): string {
  if (role === 'ADMIN') return '/admin/chat'
  if (role === 'TEKNISI') return '/teknisi/chat'
  return '/user/chat'
}

export function accountPathForRole(role: UserRole): string {
  if (role === 'ADMIN') return '/admin/settings'
  if (role === 'TEKNISI') return '/teknisi/settings'
  return '/user/akun'
}

export function saldoPathForRole(role: UserRole): string {
  if (role === 'TEKNISI') return '/teknisi/saldo'
  return '/user/riwayat'
}

export function showProfileSaldoForRole(role: UserRole): boolean {
  return role === 'USER' || role === 'TEKNISI'
}

export type ProfileMenuItem = { label: string; href: string }

const TEKNISI_WORKSPACE_SEGMENTS = new Set([
  'dashboard',
  'settings',
  'saldo',
  'produk',
  'pesanan',
  'orders',
  'remote',
  'rekber',
  'konsultasi',
  'inspeksi',
  'toko',
  'help',
  'bantuan',
  'tickets',
  'analitik',
  'chat',
  'profil',
])

const PUBLIC_PATH_PREFIXES = [
  '/',
  '/shop',
  MARKETPLACE_PATH,
  '/topup',
  '/imei',
  '/toko',
  '/teknisi',
  '/remote',
  '/rekber',
  '/inspeksi',
  '/lowongan',
  '/cart',
  '/legal',
  '/kontak',
  '/coming-soon',
] as const

function matchesPublicPrefix(pathname: string, prefix: string): boolean {
  if (prefix === '/') return pathname === '/'
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** Beranda, Market, Layanan, Toko, Mitra — halaman konsumen (bukan shell teknisi/admin/user). */
export function isPublicConsumerZone(pathname: string | null): boolean {
  if (!pathname) return false
  if (PUBLIC_PATH_PREFIXES.some((p) => matchesPublicPrefix(pathname, p))) {
    if (pathname === '/teknisi' || pathname.startsWith('/teknisi/')) {
      const teknisiProfile = pathname.match(/^\/teknisi\/([^/]+)$/)
      if (teknisiProfile) {
        return !TEKNISI_WORKSPACE_SEGMENTS.has(teknisiProfile[1])
      }
      return pathname === '/teknisi'
    }
    return true
  }
  return false
}

export function isOnRoleDashboard(pathname: string | null, role: UserRole): boolean {
  if (!pathname) return false
  return pathname === homePathForRole(role)
}

/** Admin shell routes — slot 1 bottom nav stays Dashboard; profile shows Market link. */
export function isAdminWorkspaceZone(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

/** Profile dropdown links (before Saldo & Keluar), ordered per role. */
export function profileMenuItemsForRole(
  role: UserRole,
  pathname: string | null = null,
): ProfileMenuItem[] {
  if (role === 'TEKNISI') {
    return [
      { label: 'Marketplace', href: MARKETPLACE_PATH },
      { label: 'Profil', href: TEKNISI_PUBLIC_PROFILE_PATH },
      { label: 'Analitik', href: '/teknisi/analitik' },
    ]
  }
  if (role === 'USER' && pathname && isUserDashboardZone(pathname)) {
    return [
      { label: 'Marketplace', href: MARKETPLACE_PATH },
      { label: 'Profil', href: accountPathForRole('USER') },
    ]
  }
  return [{ label: 'Profil', href: accountPathForRole(role) }]
}

type BottomNavItemLike = {
  icon: IconType
  label: string
  href: string
  activePrefixes?: string[]
}

function swapMarketSlotToDashboard<T extends BottomNavItemLike>(
  items: readonly T[],
  role: UserRole,
  dashboardIcon: IconType,
): T[] {
  const marketIndex = items.findIndex(
    (item) => item.href === MARKETPLACE_PATH || item.label === 'Market',
  )
  if (marketIndex === -1) {
    return [...items]
  }

  const home = homePathForRole(role)
  const next = [...items]
  next[marketIndex] = {
    ...items[marketIndex],
    icon: dashboardIcon,
    label: 'Dashboard',
    href: home,
    activePrefixes: [home],
  }
  return next
}

/** USER: first slot follows persisted Market vs Dashboard context. */
export function applyUserNavHomeSlot<T extends BottomNavItemLike>(
  items: readonly T[],
  mode: UserNavHomeMode,
  dashboardIcon: IconType,
): T[] {
  if (mode !== 'dashboard') {
    return [...items]
  }
  return swapMarketSlotToDashboard(items, 'USER', dashboardIcon)
}

/** Teknisi: Dashboard di slot pertama di workspace & shared routes (cart). Admin: seluruh /admin/*. */
export function applyDashboardBottomNavSwap<T extends BottomNavItemLike>(
  items: readonly T[],
  pathname: string | null,
  role: UserRole,
  dashboardIcon: IconType,
  teknisiNavMode: TeknisiNavHomeMode = 'workspace',
): T[] {
  if (role === 'TEKNISI' && shouldTeknisiDashboardFirstSlot(pathname, teknisiNavMode)) {
    return swapMarketSlotToDashboard(items, role, dashboardIcon)
  }
  if (role === 'ADMIN' && isAdminWorkspaceZone(pathname)) {
    return swapMarketSlotToDashboard(items, role, dashboardIcon)
  }
  if (!isOnRoleDashboard(pathname, role)) {
    return [...items]
  }
  return swapMarketSlotToDashboard(items, role, dashboardIcon)
}

/** Profile menu on marketplace & public pages. */
export function publicProfileMenuItemsForRole(
  role: UserRole,
  pathname: string | null = null,
): ProfileMenuItem[] {
  const onPublic = isPublicConsumerZone(pathname)

  if (role === 'TEKNISI') {
    const marketOrDashboard: ProfileMenuItem = onPublic
      ? { label: 'Dashboard', href: homePathForRole('TEKNISI') }
      : { label: 'Market', href: MARKETPLACE_PATH }
    return [
      marketOrDashboard,
      { label: 'Profil', href: TEKNISI_PUBLIC_PROFILE_PATH },
      { label: 'Analitik', href: '/teknisi/analitik' },
    ]
  }

  const items: ProfileMenuItem[] = []
  if (onPublic) {
    items.push({ label: 'Dashboard', href: homePathForRole(role) })
  }
  items.push({
    label: 'Profil',
    href: accountPathForRole(role),
  })
  return items
}
