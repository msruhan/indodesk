'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { cn } from '@/lib/utils'
import { useAuth, type UserRole } from '@/contexts/auth-context'
import { Search, Bell, Calendar, ChevronDown, MessageCircle, LogOut } from '@/lib/icons'
import { notificationMatchesRole } from '@/data/mock-platform-notifications'
import {
  NOTIFICATIONS_UPDATED_EVENT,
  loadPlatformNotifications,
} from '@/lib/platform-content-storage'
import { notificationIconMap, notificationToneClass } from '@/lib/notification-display'
import { profileMenuItemsForRole } from '@/lib/role-routes'
import { setChatBottomNavMode } from '@/lib/chat-bottom-nav'
import {
  headerActionsGroupClass,
  headerIconButtonClass,
  headerIconClass,
  mobileHeaderBarRowClass,
  mobileHeaderBarRowDesktopClass,
  mobileHeaderSearchInputClass,
} from '@/components/mobile/header-action-styles'
import { HeaderCartLink } from '@/components/mobile/header-cart-link'

function getChatHref(role: UserRole): string {
  if (role === 'ADMIN') return '/admin/chat'
  if (role === 'TEKNISI') return '/teknisi/chat'
  return '/user/chat'
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const commandSuggestions = [
  { label: 'Cari order ORD-2024', hint: 'Transaksi dan status pembayaran' },
  { label: 'Review approval terbaru', hint: 'Produk, toko, dan teknisi pending' },
  { label: 'Buka security center', hint: 'MFA, device, dan session' },
]

export function DashboardHeader() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [notifications, setNotifications] = useState(() =>
    typeof window !== 'undefined' ? loadPlatformNotifications() : [],
  )

  useEffect(() => {
    const refresh = () => setNotifications(loadPlatformNotifications())
    refresh()
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh)
  }, [])

  const visibleNotifications = notifications.filter((n) =>
    notificationMatchesRole(n, user?.role),
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsCommandOpen(true)
      }
      if (event.key === 'Escape') {
        setIsCommandOpen(false)
        setIsNotificationsOpen(false)
        setIsAccountOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-surface-200/60 bg-white/75 backdrop-blur-xl">
      <div className={cn(mobileHeaderBarRowClass, mobileHeaderBarRowDesktopClass)}>
        {/* Search — Linear/Raycast inspired */}
        <div className="flex max-w-md flex-1 items-center">
          <div className="relative w-full">
            <Search className={cn(searchInputIconClass, 'left-3.5')} strokeWidth={2} aria-hidden />
            <Input
              type="text"
              placeholder="Cari order, user, produk…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsCommandOpen(true)}
              onBlur={() => window.setTimeout(() => setIsCommandOpen(false), 120)}
              className={mobileHeaderSearchInputClass}
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-surface-200/80 bg-white px-1.5 py-0.5 text-[10px] font-medium text-surface-500 sm:inline-flex">
              ⌘K
            </kbd>

            <AnimatePresence>
              {isCommandOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-surface-200/70 bg-white p-2 shadow-soft-lg"
                >
                  <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-400">
                    Smart search
                  </div>
                  <div className="space-y-1">
                    {commandSuggestions.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-50"
                      >
                        <div className="text-sm font-medium text-ink">{item.label}</div>
                        <div className="text-xs text-surface-500">{item.hint}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right actions — same icon size/position as marketplace header */}
        <div className={headerActionsGroupClass}>
          <button className="hidden md:inline-flex h-10 items-center gap-2 rounded-full border border-surface-200/80 bg-white/60 px-3 text-sm text-surface-600 backdrop-blur-md transition-colors hover:border-surface-300 hover:text-ink">
            <Calendar className="h-4 w-4" />
            <span>Mei 2026</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          <Link
            href={user?.role ? getChatHref(user.role) : '/login'}
            className={cn(headerIconButtonClass, 'hover:text-primary-700')}
            aria-label="Chat"
            onClick={() => {
              setChatBottomNavMode('dashboard')
              setIsNotificationsOpen(false)
              setIsAccountOpen(false)
            }}
          >
            <MessageCircle className={headerIconClass} />
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((value) => !value)
              setIsAccountOpen(false)
            }}
            className={headerIconButtonClass}
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className={headerIconClass} />
            {visibleNotifications.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {user && (user.role === 'USER' || user.role === 'TEKNISI') && (
            <HeaderCartLink
              onClick={() => {
                setIsNotificationsOpen(false)
                setIsAccountOpen(false)
              }}
            />
          )}

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(100vw-2rem,320px)] rounded-2xl border border-surface-200/70 bg-white p-2 shadow-soft-lg"
              >
                <div className="flex items-center justify-between px-2 py-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">Notification center</p>
                    <p className="text-xs text-surface-500">
                      {user?.role === 'ADMIN'
                        ? 'Alert operasional platform'
                        : user?.role === 'TEKNISI'
                          ? 'Order, chat, dan layanan'
                          : 'Pesanan, promo, dan aktivitas'}
                    </p>
                  </div>
                  {visibleNotifications.length > 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">
                      {visibleNotifications.length} baru
                    </span>
                  )}
                </div>
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {visibleNotifications.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-surface-500">Tidak ada notifikasi</p>
                  ) : (
                    visibleNotifications.map((item) => {
                      const Icon = notificationIconMap[item.icon]
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-50"
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl',
                              notificationToneClass[item.tone],
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-ink">{item.title}</span>
                            <span className="block text-xs text-surface-500 line-clamp-2">{item.body}</span>
                            <span className="mt-0.5 block text-[11px] text-surface-400">{item.timeLabel}</span>
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {user && (
            <div className="relative lg:hidden">
              <button
                type="button"
                onClick={() => {
                  setIsAccountOpen((v) => !v)
                  setIsNotificationsOpen(false)
                }}
                className={cn(
                  headerIconButtonClass,
                  isAccountOpen && 'border-primary-300 bg-primary-50/80 text-primary-700',
                  'text-[10px] font-bold text-primary-700',
                )}
                aria-label="Menu akun"
                aria-expanded={isAccountOpen}
              >
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
              </button>

              <AnimatePresence>
                {isAccountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-[calc(100%+8px)] z-50 w-[11.5rem] overflow-hidden rounded-xl border border-surface-200/70 bg-white/95 p-1.5 shadow-soft-lg backdrop-blur-xl"
                  >
                    <div className="border-b border-surface-200/60 px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-surface-500">{user.email}</p>
                    </div>
                    {profileMenuItemsForRole(user.role, pathname).map((item, index) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'block rounded-xl px-3 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50',
                          index === 0 && 'mt-1',
                        )}
                        onClick={() => setIsAccountOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    {user.role === 'ADMIN' && (
                      <>
                        <Link
                          href="/admin/banners"
                          className="block rounded-xl px-3 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
                          onClick={() => setIsAccountOpen(false)}
                        >
                          Banner
                        </Link>
                        <Link
                          href="/admin/notifications"
                          className="block rounded-xl px-3 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
                          onClick={() => setIsAccountOpen(false)}
                        >
                          Notifikasi
                        </Link>
                      </>
                    )}
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                      onClick={() => {
                        setIsAccountOpen(false)
                        void logout()
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Keluar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
