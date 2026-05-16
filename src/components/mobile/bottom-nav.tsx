'use client'

import { useLayoutEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import {
  Home,
  ShoppingBag,
  Users,
  Store,
  LayoutDashboard,
} from '@/lib/icons'
import {
  USER_BOTTOM_NAV_ITEMS,
  isUserBottomNavItemActive,
  type UserBottomNavItem,
} from '@/lib/user-bottom-nav'
import {
  applyUserNavHomeSlot,
  homePathForRole,
  MARKETPLACE_PATH,
} from '@/lib/role-routes'
import {
  getUserNavHomeModeForPath,
  setUserNavHomeMode,
  subscribeUserNavHome,
  syncUserNavHomeModeFromPath,
} from '@/lib/user-nav-home'

const guestNavItems = [
  { icon: Home, label: 'Beranda', href: '/' },
  { icon: ShoppingBag, label: 'Market', href: '/marketplace' },
  { icon: Users, label: 'Layanan', href: '/teknisi' },
  { icon: Store, label: 'Toko', href: '/toko' },
] as const

type GuestNavItem = (typeof guestNavItems)[number]

function isGuestNavItemActive(item: GuestNavItem, pathname: string | null): boolean {
  if (item.href === '/marketplace') {
    return (
      pathname === '/marketplace' ||
      pathname?.startsWith('/marketplace/') ||
      pathname === '/cart' ||
      pathname?.startsWith('/cart/') ||
      pathname === '/topup' ||
      (pathname?.startsWith('/topup/') ?? false)
    )
  }
  return (
    pathname === item.href ||
    (item.href !== '/' && (pathname?.startsWith(item.href) ?? false))
  )
}

/**
 * Mobile bottom navigation for public pages.
 * Logged-in USER sees one model: Market, Layanan, Toko, Riwayat (no Beranda).
 */
export function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const isUser = user?.role === 'USER'

  useLayoutEffect(() => {
    if (!isUser) return
    syncUserNavHomeModeFromPath(pathname)
  }, [isUser, pathname])

  const userHomeMode = useSyncExternalStore(
    subscribeUserNavHome,
    () => (isUser ? getUserNavHomeModeForPath(pathname) : 'market'),
    () => (isUser ? getUserNavHomeModeForPath(pathname) : 'market'),
  )

  const navItems: readonly (UserBottomNavItem | GuestNavItem)[] = isUser
    ? applyUserNavHomeSlot(USER_BOTTOM_NAV_ITEMS, userHomeMode, LayoutDashboard)
    : guestNavItems

  const onUserNavClick = (href: string) => {
    if (href === MARKETPLACE_PATH) {
      setUserNavHomeMode('market')
      return
    }
    if (href === homePathForRole('USER')) {
      setUserNavHomeMode('dashboard')
      return
    }
    if (userHomeMode === 'dashboard') {
      setUserNavHomeMode('dashboard')
    }
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-3 pt-2 lg:hidden"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
      aria-label="Mobile navigation"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/70 to-transparent"
      />

      <div className="relative mx-auto flex h-[68px] max-w-md items-center justify-around rounded-3xl glass-strong border border-surface-200/70 px-2 shadow-soft-lg">
        {navItems.map((item) => {
          const isActive = isUser
            ? isUserBottomNavItemActive(item as UserBottomNavItem, pathname)
            : isGuestNavItemActive(item as GuestNavItem, pathname)

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={() => isUser && onUserNavClick(item.href)}
              className={cn(
                'relative flex h-14 flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl transition-colors',
                isActive ? 'text-primary-700' : 'text-surface-500 hover:text-ink',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId={`mobile-bottom-active-${userHomeMode}`}
                  className="absolute inset-x-1 top-1 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-white ring-1 ring-inset ring-primary-200/60 shadow-soft-xs"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <motion.span
                className="relative z-10"
                animate={isActive ? { y: -1, scale: 1.06 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 480, damping: 26 }}
              >
                <item.icon className="h-[20px] w-[20px]" />
              </motion.span>
              <span
                className={cn(
                  'relative z-10 text-[11px] leading-none',
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

/**
 * Spacer that reserves the height of the mobile bottom nav on small screens.
 */
export function MobileSafeAreaSpacer() {
  return (
    <div
      aria-hidden
      className="lg:hidden"
      style={{
        height: 'calc(68px + 12px + 12px + env(safe-area-inset-bottom, 0px))',
      }}
    />
  )
}
