import type { UserRole } from '@prisma/client'
import type { IconType } from '@/lib/icons-types'
import type { UserNavHomeMode } from '@/lib/user-nav-home'
import {
  isTeknisiWorkspaceZone,
  shouldTeknisiDashboardFirstSlot,
  type TeknisiNavHomeMode,
} from '@/lib/teknisi-nav-home'

export const MARKETPLACE_PATH = '/marketplace'

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
  if (role === 'TEKNISI') return '/teknisi/profil'
  return '/user/akun'
}

export type ProfileMenuItem = { label: string; href: string }

export function isOnRoleDashboard(pathname: string | null, role: UserRole): boolean {
  if (!pathname) return false
  return pathname === homePathForRole(role)
}

/** Admin shell routes — slot 1 bottom nav stays Dashboard; profile shows Market link. */
export function isAdminWorkspaceZone(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

/** Profile dropdown links (before Keluar), ordered per role. */
export function profileMenuItemsForRole(
  role: UserRole,
  pathname?: string | null,
): ProfileMenuItem[] {
  const dashboard = { label: 'Dashboard', href: homePathForRole(role) }

  let items: ProfileMenuItem[]
  if (role === 'TEKNISI') {
    items = [
      dashboard,
      { label: 'Akun', href: '/teknisi/profil' },
      { label: 'Setting', href: '/teknisi/settings' },
      { label: 'Analitik', href: '/teknisi/analitik' },
    ]
  } else {
    items = [dashboard, { label: 'Akun', href: accountPathForRole(role) }]
  }

  if (pathname) {
    if (role === 'TEKNISI' && isTeknisiWorkspaceZone(pathname)) {
      return [{ label: 'Market', href: MARKETPLACE_PATH }, ...items.slice(1)]
    }
    if (role === 'ADMIN' && isAdminWorkspaceZone(pathname)) {
      return [{ label: 'Market', href: MARKETPLACE_PATH }, ...items.slice(1)]
    }
    if (isOnRoleDashboard(pathname, role)) {
      return [{ label: 'Market', href: MARKETPLACE_PATH }, ...items.slice(1)]
    }
  }

  return items
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

/** Profile menu on marketplace & public pages — Dashboard + Akun only. */
export function publicProfileMenuItemsForRole(role: UserRole): ProfileMenuItem[] {
  return [
    { label: 'Dashboard', href: homePathForRole(role) },
    { label: 'Akun', href: accountPathForRole(role) },
  ]
}
