'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/sidebar-context'
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  type IconType,
} from '@/lib/icons-types'

export interface SidebarNavItem {
  icon: IconType
  label: string
  href: string
  badge?: string | number
}

interface RoleSidebarProps {
  brand?: {
    label: string
    href?: string
  }
  /** Items shown in the main scroll area */
  items: readonly SidebarNavItem[]
  /** Items pinned to the bottom (Settings / Help / Chat) */
  bottomItems: readonly SidebarNavItem[]
  /** Profile chip content */
  profile: {
    initials: string
    name: string
    email: string
  }
  /** Optional accent label e.g. "Admin", "Teknisi", "User" — shown next to the logo */
  scope?: string
}

/**
 * Premium role-aware sidebar.
 * - Glass surface with hairline border
 * - Animated active pill (layoutId) for fluid transitions
 * - Magnet-style hover lift, subtle floating toggle
 * - Single source for Admin / Teknisi / User
 */
export function RoleSidebar({
  brand = { label: 'IndoTeknizi', href: '/' },
  items,
  bottomItems,
  profile,
  scope,
}: RoleSidebarProps) {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()

  const renderItem = (item: SidebarNavItem) => {
    const isActive =
      pathname === item.href || pathname?.startsWith(item.href + '/')
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'group/nav relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-300',
          isActive
            ? 'text-primary-700'
            : 'text-surface-600 hover:text-ink',
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive && (
          <motion.span
            layoutId="role-sidebar-active"
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-50 to-primary-50/40 ring-1 ring-inset ring-primary-200/60 shadow-soft-xs"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}
        <span className="relative z-10 flex w-full items-center gap-3">
          <span
            className={cn(
              'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300',
              isActive
                ? 'bg-white text-primary-700 shadow-soft-xs'
                : 'text-surface-500 group-hover/nav:text-ink',
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
          </span>
          <span className="truncate">{item.label}</span>
          {item.badge !== undefined && (
            <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-100 px-1.5 text-[10px] font-semibold text-primary-700">
              {item.badge}
            </span>
          )}
        </span>
      </Link>
    )
  }

  return (
    <>
      {/* Floating toggle */}
      <button
        onClick={toggleSidebar}
        aria-label={isCollapsed ? 'Open sidebar' : 'Close sidebar'}
        className={cn(
          'fixed top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full glass-strong border border-surface-200/70 shadow-soft-md backdrop-blur-md text-surface-700 transition-all duration-450 ease-out-expo hover:scale-105 hover:text-ink hover:shadow-soft-lg',
          isCollapsed ? 'left-4' : 'left-[268px]',
        )}
      >
        <motion.span
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <ChevronRight className="h-4 w-4" />
        </motion.span>
      </button>

      {/* Sidebar surface */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.aside
            initial={{ x: -288, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -288, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 top-0 z-40 hidden h-screen w-64 lg:flex flex-col"
          >
            {/* Glass background with subtle aurora */}
            <div className="absolute inset-0 -z-10 bg-white/85 backdrop-blur-xl" />
            <div
              aria-hidden
              className="aurora-blob aurora-blob-emerald pointer-events-none absolute -left-16 top-32 -z-10 h-72 w-72 opacity-25"
            />
            <div
              aria-hidden
              className="absolute inset-y-0 right-0 -z-10 w-px bg-gradient-to-b from-transparent via-surface-200/70 to-transparent"
            />

            {/* Brand */}
            <div className="flex h-16 items-center border-b border-surface-200/60 px-5">
              <Link href={brand.href ?? '/'} className="group/logo flex items-center gap-2.5">
                <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 shadow-glow-primary transition-transform duration-450 group-hover/logo:scale-[1.06]">
                  <Zap weight="fill" className="h-4 w-4 text-white" />
                  <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 to-transparent" />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-[15px] font-bold tracking-tight text-ink">
                    {brand.label}
                  </span>
                  {scope && (
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-700">
                      {scope}
                    </span>
                  )}
                </span>
              </Link>
            </div>

            {/* Main nav */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {items.map(renderItem)}
            </nav>

            {/* Bottom */}
            <div className="space-y-1 border-t border-surface-200/60 px-3 py-4">
              {bottomItems.map(renderItem)}

              {/* Profile chip */}
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-surface-200/70 bg-white/80 p-2.5 shadow-soft-xs backdrop-blur-md">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-semibold text-white shadow-soft-xs">
                  {profile.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {profile.name}
                  </p>
                  <p className="truncate text-xs text-surface-500">{profile.email}</p>
                </div>
                <button
                  className="rounded-lg p-1.5 text-surface-500 transition-colors hover:bg-surface-100 hover:text-ink"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
