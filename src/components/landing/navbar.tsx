'use client'

import { Fragment, useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Magnetic } from '@/components/motion'
import { useAuth } from '@/contexts/auth-context'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import {
  canAccessImeiService,
  canAccessRemoteService,
  canAccessInspectionService,
} from '@/lib/platform-settings-shared'
import { BrandLogo } from '@/components/brand/brand-logo'
import {
  Menu,
  X,
  Zap,
  ChevronDown,
  LogOut,
  ShoppingBag,
  Smartphone,
  Store,
  Users,
  Laptop,
  Shield,
  CheckSquare,
  Briefcase,
  ArrowRight,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { PublicHeaderActions } from '@/components/mobile/public-header-actions'
import { ProfileMenuSaldoItem } from '@/components/shared/profile-menu-saldo-item'
import { homePathForRole, publicProfileMenuItemsForRole } from '@/lib/role-routes'
import { setTeknisiNavHomeMode } from '@/lib/teknisi-nav-home'
import { setUserNavHomeMode } from '@/lib/user-nav-home'
import type { UserRole } from '@prisma/client'

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const ALL_NAV_GROUPS = [
  {
    label: 'Belanja',
    items: [
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/topup', label: 'Top Up' },
      { href: '/imei', label: 'Layanan Digital', requireImei: true },
    ],
  },
  {
    label: 'Ruang Teknisi',
    items: [
      { href: '/teknisi', label: 'Cari Teknisi' },
      { href: '/remote', label: 'Remote Online', requireRemote: true },
      { href: '/inspeksi', label: 'Inspeksi HP', requireInspection: true },
    ],
  },
  {
    label: 'Mitra',
    items: [
      { href: '/toko', label: 'Direktori Toko' },
      { href: '/lowongan', label: 'Karir / Lowongan' },
    ],
  },
] as const

const STANDALONE_NAV_LINK = { href: '/rekber', label: 'Rekber Aman' } as const

const ALL_MOBILE_NAV_SECTIONS: {
  title?: string
  items: {
    href: string
    label: string
    icon: typeof ShoppingBag
    requireImei?: boolean
    requireRemote?: boolean
    requireInspection?: boolean
  }[]
}[] = [
  {
    title: 'Belanja',
    items: [
      { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
      { href: '/topup', label: 'Top Up', icon: Zap },
      { href: '/imei', label: 'Layanan Digital', icon: Smartphone, requireImei: true },
    ],
  },
  {
    title: 'Layanan Teknisi',
    items: [
      { href: '/teknisi', label: 'Cari Teknisi', icon: Users },
      { href: '/remote', label: 'Remote Online', icon: Laptop, requireRemote: true },
      {
        href: '/inspeksi',
        label: 'Inspeksi HP',
        icon: CheckSquare,
        requireInspection: true,
      },
    ],
  },
  {
    items: [{ href: '/rekber', label: 'Rekber Aman', icon: Shield }],
  },
  {
    title: 'Gabung',
    items: [
      { href: '/toko', label: 'Direktori Toko', icon: Store },
      { href: '/lowongan', label: 'Karir / Lowongan', icon: Briefcase },
    ],
  },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, isLoading, logout } = useAuth()
  const { flags } = useFeatureFlags()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDesktopGroup, setOpenDesktopGroup] = useState<string | null>(null)
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const { scrollY } = useScroll()
  const containerWidth = useTransform(scrollY, [0, 200], ['100%', '92%'])
  const containerY = useTransform(scrollY, [0, 200], [0, 8])

  // Gate menu "Layanan Perangkat" / "Remote" / "Inspeksi" berdasarkan role
  // dan toggle admin (feature flag).
  const role =
    (user?.role as 'ADMIN' | 'TEKNISI' | 'USER' | undefined) ?? null
  const canSeeImei = canAccessImeiService(role, flags)
  const canSeeRemote = canAccessRemoteService(role, flags)
  const canSeeInspection = canAccessInspectionService(role, flags)

  const navGroups = useMemo(
    () =>
      ALL_NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((i) => {
          if ('requireImei' in i && i.requireImei && !canSeeImei) return false
          if ('requireRemote' in i && i.requireRemote && !canSeeRemote) return false
          if ('requireInspection' in i && i.requireInspection && !canSeeInspection) {
            return false
          }
          return true
        }),
      })).filter((g) => g.items.length > 0),
    [canSeeImei, canSeeRemote, canSeeInspection],
  )

  const mobileNavSections = useMemo(
    () =>
      ALL_MOBILE_NAV_SECTIONS.map((s) => ({
        ...s,
        items: s.items.filter((i) => {
          if (i.requireImei && !canSeeImei) return false
          if (i.requireRemote && !canSeeRemote) return false
          if (i.requireInspection && !canSeeInspection) return false
          return true
        }),
      })).filter((s) => s.items.length > 0),
    [canSeeImei, canSeeRemote, canSeeInspection],
  )

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!isMobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobileMenuOpen])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 pt-3 sm:px-6"
    >
      <motion.nav
        style={{ maxWidth: containerWidth, y: containerY }}
        className={[
          'mx-auto w-full max-w-7xl rounded-full',
          'transition-[background,backdrop-filter,box-shadow,border-color] duration-450 ease-out-expo',
          isScrolled
            ? 'glass-strong border border-surface-200/70 shadow-soft-md'
            : 'border border-transparent bg-white/40 backdrop-blur-md',
        ].join(' ')}
      >
        <motion.div className="relative flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:h-16">
          <Link href="/" className="relative z-10 flex shrink-0 items-center group/logo">
            <BrandLogo
              variant="icon"
              iconClassName="sm:hidden transition-transform duration-450 group-hover/logo:scale-[1.06]"
            />
            <BrandLogo
              variant="wordmark"
              wordmarkClassName="hidden sm:block"
              className="hidden sm:inline-flex"
            />
          </Link>

          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center lg:flex">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-200/60 bg-white/60 px-2 py-1 shadow-soft-xs backdrop-blur-md">
            {navGroups.map((group, index) => {
              const open = openDesktopGroup === group.label
              return (
                <Fragment key={group.label}>
                <div
                  className="relative"
                  onMouseEnter={() => setOpenDesktopGroup(group.label)}
                  onMouseLeave={() => setOpenDesktopGroup(null)}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDesktopGroup(open ? null : group.label)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setOpenDesktopGroup(null)
                    }}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    className="relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium text-surface-600 transition-colors duration-300 hover:text-ink"
                  >
                    <span className="relative z-10">{group.label}</span>
                    <ChevronDown
                      className={[
                        'relative z-10 h-3.5 w-3.5 transition-transform duration-300',
                        open ? 'rotate-180 text-ink' : 'text-surface-500',
                      ].join(' ')}
                    />
                    <span className="absolute inset-0 rounded-full bg-surface-100/0 transition-colors duration-300 hover:bg-surface-100" />
                  </button>

                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 top-[calc(100%+10px)] z-50 min-w-44 rounded-2xl glass-strong border border-surface-200/70 p-1.5 shadow-soft-lg"
                        role="menu"
                      >
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            className="block rounded-xl px-3.5 py-2 text-[13px] font-medium text-surface-700 transition-colors hover:bg-surface-100/80 hover:text-ink"
                            onClick={() => setOpenDesktopGroup(null)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {index === 1 && (
                  <Link
                    href={STANDALONE_NAV_LINK.href}
                    className={cn(
                      'relative inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-300 hover:text-ink',
                      pathname === STANDALONE_NAV_LINK.href ||
                        pathname?.startsWith(`${STANDALONE_NAV_LINK.href}/`)
                        ? 'text-ink'
                        : 'text-surface-600',
                    )}
                  >
                    {STANDALONE_NAV_LINK.label}
                  </Link>
                )}
                </Fragment>
              )
            })}
            </div>
          </div>

          <div className="relative z-10 ml-auto hidden items-center gap-3 lg:flex">
            <PublicHeaderActions hideProfileIcon />

          {/* Desktop auth */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-9 w-28 animate-pulse rounded-full bg-surface-200/80" />
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenUserMenu((open) => !open)}
                  className="flex items-center gap-2.5 rounded-full border border-surface-200/70 bg-white/70 py-1.5 pl-1.5 pr-3 shadow-soft-xs transition-colors hover:bg-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-600 text-xs font-bold text-white">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.image}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(user.name)
                    )}
                  </span>
                  <span className="max-w-[120px] truncate text-left text-[13px] font-medium text-ink">
                    {user.name}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 text-surface-500 transition-transform',
                      openUserMenu && 'rotate-180',
                    )}
                  />
                </button>

                <AnimatePresence>
                  {openUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full z-[200] min-w-52 pt-2"
                    >
                      <div className="rounded-2xl glass-strong border border-surface-200/70 p-1.5 shadow-soft-lg">
                        <div className="border-b border-surface-200/60 px-3.5 py-2.5">
                        <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                        <p className="truncate text-xs text-surface-500">{user.email}</p>
                      </div>
                      {publicProfileMenuItemsForRole(user.role as UserRole, pathname).map((item) => (
                        <Link
                          key={`${item.href}-${item.label}`}
                          href={item.href}
                          className="mt-1 block rounded-xl px-3.5 py-2 text-[13px] font-medium text-surface-700 transition-colors hover:bg-surface-100/80 hover:text-ink first:mt-1"
                          onClick={() => {
                            if (item.href === homePathForRole(user.role as UserRole)) {
                              if (user.role === 'TEKNISI') setTeknisiNavHomeMode('workspace')
                              if (user.role === 'USER') setUserNavHomeMode('dashboard')
                            }
                            setOpenUserMenu(false)
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <ProfileMenuSaldoItem
                        role={user.role as UserRole}
                        onNavigate={() => setOpenUserMenu(false)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setOpenUserMenu(false)
                          void logout()
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-left text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Keluar
                      </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-surface-600 hover:text-ink">
                    Masuk
                  </Button>
                </Link>
                <Magnetic strength={6}>
                  <Link href="/register">
                    <Button variant="primary" size="sm">
                      Mulai gratis
                    </Button>
                  </Link>
                </Magnetic>
              </>
            )}
          </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative z-10 lg:hidden -mr-1.5 inline-flex h-10 w-10 items-center justify-center rounded-full text-surface-700 transition-colors hover:bg-surface-100"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileMenuOpen ? (
                <motion.span
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Tutup menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-3 right-3 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-surface-200/80 bg-white/95 shadow-soft-xl backdrop-blur-xl lg:hidden"
            >
              <div className="max-h-[min(70dvh,520px)] overflow-y-auto p-2">
                <nav className="space-y-1" aria-label="Menu navigasi">
                  {mobileNavSections.map((section, sectionIndex) => (
                    <div key={section.title ?? `section-${sectionIndex}`}>
                      {section.title && (
                        <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
                          {section.title}
                        </p>
                      )}
                      {section.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-50 active:bg-surface-100"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-100 text-surface-600">
                              <Icon className="h-[18px] w-[18px]" />
                            </span>
                            <span className="flex-1">{item.label}</span>
                            <ArrowRight className="h-4 w-4 text-surface-300" />
                          </Link>
                        )
                      })}
                    </div>
                  ))}
                </nav>

                <div className="mt-2 border-t border-surface-200/70 pt-2">
                  {isLoading ? (
                    <div className="mx-2 h-11 animate-pulse rounded-xl bg-surface-100" />
                  ) : user ? (
                    <div className="space-y-1 px-1">
                      <div className="flex items-center gap-2.5 rounded-xl bg-surface-50 px-3 py-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-600 text-xs font-bold text-white">
                          {getInitials(user.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                          <p className="truncate text-[11px] text-surface-500">{user.email}</p>
                        </div>
                      </div>
                      {publicProfileMenuItemsForRole(user.role as UserRole, pathname).map((item) => (
                        <Link
                          key={`${item.href}-${item.label}`}
                          href={item.href}
                          onClick={() => {
                            if (item.href === homePathForRole(user.role as UserRole)) {
                              if (user.role === 'TEKNISI') setTeknisiNavHomeMode('workspace')
                              if (user.role === 'USER') setUserNavHomeMode('dashboard')
                            }
                            setIsMobileMenuOpen(false)
                          }}
                          className="block rounded-xl px-3 py-2.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
                        >
                          {item.label}
                        </Link>
                      ))}
                      <ProfileMenuSaldoItem
                        role={user.role as UserRole}
                        size="sm"
                        className="mt-0 px-3 py-2.5 text-sm"
                        onNavigate={() => setIsMobileMenuOpen(false)}
                      />
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          void logout()
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Keluar
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 px-1 pb-1">
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="h-10 w-full">
                          Masuk
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="primary" size="sm" className="h-10 w-full">
                          Daftar
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
