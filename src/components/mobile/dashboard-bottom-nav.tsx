'use client'

import { Suspense, useLayoutEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { USER_BOTTOM_NAV_ITEMS } from '@/lib/user-bottom-nav'
import { applyDashboardBottomNavSwap, homePathForRole, MARKETPLACE_PATH } from '@/lib/role-routes'
import { useAuth, type UserRole } from '@/contexts/auth-context'
import {
  getTeknisiNavHomeModeForPath,
  setTeknisiNavHomeMode,
  subscribeTeknisiNavHome,
  syncTeknisiNavHomeModeFromPath,
} from '@/lib/teknisi-nav-home'
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Store,
  History,
  BarChart3,
  CheckSquare,
  Package,
  Laptop,
} from '@/lib/icons'

type NavItem = {
  icon: typeof LayoutDashboard
  label: string
  href: string
  /** Extra path prefixes that also highlight this item */
  activePrefixes?: string[]
  /** Active when ?tab= matches (management hub) */
  matchTab?: string
  /** Inactive on management hub when ?tab= matches */
  excludeTab?: string
}

const adminNav: NavItem[] = [
  {
    icon: ShoppingBag,
    label: 'Market',
    href: '/marketplace',
    activePrefixes: ['/marketplace', '/topup'],
  },
  {
    icon: Users,
    label: 'Management',
    href: '/admin/management',
    activePrefixes: ['/admin/management', '/admin/users', '/admin/teknisi', '/admin/toko'],
  },
  { icon: CheckSquare, label: 'Approval', href: '/admin/approval' },
  { icon: BarChart3, label: 'Laporan', href: '/admin/laporan' },
  {
    icon: ShoppingBag,
    label: 'Services',
    href: '/admin/produk?tab=produk',
    activePrefixes: ['/admin/produk'],
  },
]

const teknisiNav: NavItem[] = [
  {
    icon: ShoppingBag,
    label: 'Market',
    href: '/marketplace',
    activePrefixes: ['/marketplace', '/topup'],
  },
  {
    icon: Package,
    label: 'Iklan',
    href: '/teknisi/produk',
    activePrefixes: ['/teknisi/produk'],
  },
  {
    icon: Store,
    label: 'Toko',
    href: '/teknisi/toko',
    activePrefixes: ['/teknisi/toko'],
  },
  {
    icon: Laptop,
    label: 'Remote',
    href: '/teknisi/remote',
    activePrefixes: ['/teknisi/remote'],
  },
  {
    icon: History,
    label: 'Riwayat',
    href: '/teknisi/saldo',
    activePrefixes: ['/teknisi/saldo'],
  },
]

const userNav: NavItem[] = USER_BOTTOM_NAV_ITEMS.map((item) => ({
  icon: item.icon,
  label: item.label,
  href: item.href,
  activePrefixes: item.activePrefixes,
}))

function roleFromPath(pathname: string | null): UserRole | null {
  if (pathname?.startsWith('/admin')) return 'ADMIN'
  if (pathname?.startsWith('/teknisi')) return 'TEKNISI'
  if (pathname?.startsWith('/user')) return 'USER'
  return null
}

function getNavItems(
  pathname: string | null,
  role: UserRole | null,
  teknisiNavMode: 'workspace' | 'market',
): NavItem[] {
  const resolvedRole = role ?? roleFromPath(pathname)
  let items: NavItem[]
  if (resolvedRole === 'ADMIN') items = [...adminNav]
  else if (resolvedRole === 'TEKNISI') items = [...teknisiNav]
  else items = [...userNav]

  if (resolvedRole) {
    items = applyDashboardBottomNavSwap(
      items,
      pathname,
      resolvedRole,
      LayoutDashboard,
      teknisiNavMode,
    )
  }
  return items
}

/**
 * Mobile bottom navigation for authenticated dashboard pages.
 * Shows role-appropriate items based on the current route prefix.
 * Hidden on lg+ where the sidebar is visible.
 */
function isNavItemActive(item: NavItem, pathname: string | null, tab: string | null): boolean {
  if (item.matchTab !== undefined) {
    if (pathname === '/admin/management' || pathname?.startsWith('/admin/management/')) {
      return tab === item.matchTab
    }
    if (item.activePrefixes?.some((p) => pathname === p || pathname?.startsWith(`${p}/`))) {
      return true
    }
    return false
  }

  if (
    item.excludeTab &&
    (pathname === '/admin/management' || pathname?.startsWith('/admin/management/')) &&
    (tab ?? 'users') === item.excludeTab
  ) {
    return false
  }

  if (item.activePrefixes) {
    const prefixMatch = item.activePrefixes.some(
      (p) => pathname === p || pathname?.startsWith(`${p}/`),
    )
    if (prefixMatch) return true
  }

  return pathname === item.href.split('?')[0]
}

function DashboardBottomNavContent({ tab }: { tab: string | null }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isTeknisi = user?.role === 'TEKNISI'

  useLayoutEffect(() => {
    if (!isTeknisi) return
    syncTeknisiNavHomeModeFromPath(pathname)
  }, [isTeknisi, pathname])

  const teknisiNavMode = useSyncExternalStore(
    subscribeTeknisiNavHome,
    () => (isTeknisi ? getTeknisiNavHomeModeForPath(pathname) : 'workspace'),
    () => (isTeknisi ? getTeknisiNavHomeModeForPath(pathname) : 'workspace'),
  )

  const navItems = getNavItems(pathname, user?.role ?? null, teknisiNavMode)

  const onNavClick = (href: string) => {
    if (!isTeknisi) return
    if (href === MARKETPLACE_PATH) {
      setTeknisiNavHomeMode('market')
      return
    }
    if (href === homePathForRole('TEKNISI')) {
      setTeknisiNavHomeMode('workspace')
    }
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-3 pt-2 lg:hidden"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
      aria-label="Dashboard mobile navigation"
    >
      {/* Bottom fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface-50 via-surface-50/70 to-transparent"
      />

      <div className="relative mx-auto flex h-[64px] max-w-md items-center justify-around rounded-3xl glass-strong border border-surface-200/70 px-1 shadow-soft-lg">
        {navItems.map((item) => {
          const isActive = isNavItemActive(item, pathname, tab)

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={() => onNavClick(item.href)}
              className={cn(
                'relative flex h-12 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-2xl transition-colors',
                isActive ? 'text-primary-700' : 'text-surface-500 hover:text-ink',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="dashboard-bottom-active"
                  className="absolute inset-x-1 top-1 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-white ring-1 ring-inset ring-primary-200/60 shadow-soft-xs"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <motion.span
                className="relative z-10"
                animate={isActive ? { y: -0.5, scale: 1.05 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 480, damping: 26 }}
              >
                <item.icon className="h-[18px] w-[18px]" />
              </motion.span>
              <span
                className={cn(
                  'relative z-10 text-[10px] leading-none',
                  isActive ? 'font-semibold' : 'font-medium',
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function DashboardBottomNavWithSearchParams() {
  const searchParams = useSearchParams()
  return <DashboardBottomNavContent tab={searchParams.get('tab')} />
}

export function DashboardBottomNav() {
  return (
    <Suspense fallback={<DashboardBottomNavContent tab={null} />}>
      <DashboardBottomNavWithSearchParams />
    </Suspense>
  )
}

/**
 * Spacer matching the dashboard bottom nav height.
 */
export function DashboardMobileSpacer() {
  return (
    <div
      aria-hidden
      className="lg:hidden"
      style={{
        height: 'calc(64px + 12px + 12px + env(safe-area-inset-bottom, 0px))',
      }}
    />
  )
}
