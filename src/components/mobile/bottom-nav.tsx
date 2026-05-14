'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Home,
  ShoppingBag,
  Users,
  Store,
  MessageCircle,
} from '@/lib/icons'

const navItems = [
  { icon: Home, label: 'Beranda', href: '/' },
  { icon: ShoppingBag, label: 'Market', href: '/marketplace' },
  { icon: Users, label: 'Teknisi', href: '/teknisi' },
  { icon: Store, label: 'Toko', href: '/toko' },
  { icon: MessageCircle, label: 'Chat', href: '/chat' },
] as const

/**
 * Total reserved space the dock occupies on mobile, including iOS safe-area.
 * Use the matching `MobileSafeAreaSpacer` (or add `pb-mobile-nav` utility) on any
 * page that mounts <BottomNav /> so its last content row is never hidden.
 */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-3 pt-2 lg:hidden"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
      aria-label="Mobile navigation"
    >
      {/* Bottom fade for legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/70 to-transparent"
      />

      <div className="relative mx-auto flex h-[68px] max-w-md items-center justify-around rounded-3xl glass-strong border border-surface-200/70 px-2 shadow-soft-lg">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex h-14 flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl transition-colors',
                isActive ? 'text-primary-700' : 'text-surface-500 hover:text-ink',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-bottom-active"
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
 * Drop this as the LAST child inside any page wrapper that mounts <BottomNav />,
 * so the page's final content row is never tucked under the floating dock.
 *
 * The matching layout pattern:
 *   <div className="min-h-screen bg-surface-50">
 *     ... content
 *     <MobileSafeAreaSpacer />
 *     <BottomNav />
 *   </div>
 */
export function MobileSafeAreaSpacer() {
  return (
    <div
      aria-hidden
      className="lg:hidden"
      style={{
        // 68px dock + 12px top breathing + 12px bottom breathing + iOS safe area
        height: 'calc(68px + 12px + 12px + env(safe-area-inset-bottom, 0px))',
      }}
    />
  )
}
