'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingBag,
  MessageCircle,
  Users,
  UserCircle,
  Shield,
  Settings,
  Store,
  Wallet,
  TrendingUp,
  BarChart3,
  CheckSquare,
  History,
} from '@/lib/icons'

type NavItem = { icon: typeof LayoutDashboard; label: string; href: string }

const adminNav: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: CheckSquare, label: 'Approval', href: '/admin/approval' },
  { icon: BarChart3, label: 'Laporan', href: '/admin/laporan' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

const teknisiNav: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/teknisi/dashboard' },
  { icon: ShoppingBag, label: 'Produk', href: '/teknisi/produk' },
  { icon: MessageCircle, label: 'Konsultasi', href: '/teknisi/konsultasi' },
  { icon: Wallet, label: 'Saldo', href: '/teknisi/saldo' },
  { icon: TrendingUp, label: 'Analitik', href: '/teknisi/analitik' },
]

const userNav: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/user/dashboard' },
  { icon: ShoppingBag, label: 'Orders', href: '/user/orders' },
  { icon: MessageCircle, label: 'Konsultasi', href: '/user/konsultasi' },
  { icon: Shield, label: 'Rekber', href: '/user/rekber' },
  { icon: History, label: 'Riwayat', href: '/user/history' },
]

function getNavItems(pathname: string | null): NavItem[] {
  if (pathname?.startsWith('/admin')) return adminNav
  if (pathname?.startsWith('/teknisi')) return teknisiNav
  if (pathname?.startsWith('/user')) return userNav
  // fallback — generic dashboard
  return userNav
}

/**
 * Mobile bottom navigation for authenticated dashboard pages.
 * Shows role-appropriate items based on the current route prefix.
 * Hidden on lg+ where the sidebar is visible.
 */
export function DashboardBottomNav() {
  const pathname = usePathname()
  const navItems = getNavItems(pathname)

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
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
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
