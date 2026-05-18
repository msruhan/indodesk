'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DashboardSmartSearch } from '@/components/dashboard/dashboard-smart-search'
import { useAuth, type User, type UserRole } from '@/contexts/auth-context'
import { Bell, ChevronDown, MessageCircle, LogOut } from '@/lib/icons'
import { WalletBalanceButton } from '@/components/dashboard/wallet-balance-button'
import { usePlatformNotifications } from '@/hooks/use-platform-notifications'
import { NotificationFeedItem } from '@/components/shared/notification-feed-item'
import { ProfileMenuSaldoItem } from '@/components/shared/profile-menu-saldo-item'
import { profileMenuItemsForRole } from '@/lib/role-routes'
import { setChatBottomNavMode } from '@/lib/chat-bottom-nav'
import {
  headerActionsGroupClass,
  headerIconButtonClass,
  headerIconClass,
  mobileHeaderBarRowClass,
  mobileHeaderBarRowDesktopClass,
} from '@/components/mobile/header-action-styles'
import { HeaderCartLink } from '@/components/mobile/header-cart-link'
import { DashboardMonthFilter } from '@/components/dashboard/dashboard-month-filter'

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

function ProfileAvatar({ user }: { user: User }) {
  if (user.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.image} alt="" className="h-full w-full rounded-full object-cover" />
    )
  }
  return <span className="text-xs font-bold text-white">{getInitials(user.name)}</span>
}

export function DashboardHeader() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const {
    notifications: visibleNotifications,
    unreadCount,
    markAllAsRead,
  } = usePlatformNotifications(user?.role, user?.id)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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
        <div className="flex max-w-md flex-1 items-center">
          <DashboardSmartSearch role={user?.role ?? 'USER'} />
        </div>

        {/* Right actions — same icon size/position as marketplace header */}
        <div className={headerActionsGroupClass}>
          <DashboardMonthFilter className="hidden md:block" />

          <WalletBalanceButton />

          <Link
            href={user?.role ? getChatHref(user.role) : '/login'}
            className={cn(headerIconButtonClass, 'hover:text-primary-700 lg:hidden')}
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
              setIsNotificationsOpen((value) => {
                const next = !value
                if (next) markAllAsRead()
                return next
              })
              setIsAccountOpen(false)
            }}
            className={headerIconButtonClass}
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className={headerIconClass} />
            {unreadCount > 0 && (
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
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {visibleNotifications.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-surface-500">Tidak ada notifikasi</p>
                  ) : (
                    visibleNotifications.map((item) => (
                      <NotificationFeedItem key={item.id} item={item} />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {user && (
            <motion.div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsAccountOpen((v) => !v)
                  setIsNotificationsOpen(false)
                }}
                className={cn(
                  headerIconButtonClass,
                  'lg:hidden',
                  isAccountOpen && 'border-primary-300 bg-primary-50/80 text-primary-700',
                  !user.image && 'text-[10px] font-bold text-primary-700',
                )}
                aria-label="Menu akun"
                aria-expanded={isAccountOpen}
              >
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                  <ProfileAvatar user={user} />
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAccountOpen((v) => !v)
                  setIsNotificationsOpen(false)
                }}
                className={cn(
                  'hidden items-center gap-2.5 rounded-full border border-surface-200/70 bg-white/70 py-1.5 pl-1.5 pr-3 shadow-soft-xs transition-colors hover:bg-white lg:flex',
                  isAccountOpen && 'border-primary-300 bg-primary-50/80',
                )}
                aria-label="Menu akun"
                aria-expanded={isAccountOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-accent-600">
                  <ProfileAvatar user={user} />
                </span>
                <span className="max-w-[120px] truncate text-left text-[13px] font-medium text-ink">
                  {user.name}
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-surface-500 transition-transform',
                    isAccountOpen && 'rotate-180',
                  )}
                />
              </button>

              <AnimatePresence>
                {isAccountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(100vw-2rem,13rem)] overflow-hidden rounded-2xl border border-surface-200/70 bg-white/95 p-1.5 shadow-soft-lg backdrop-blur-xl lg:min-w-[13rem]"
                  >
                    <div className="border-b border-surface-200/60 px-3.5 py-2.5">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-surface-500">{user.email}</p>
                    </div>
                    {profileMenuItemsForRole(user.role, pathname).map((item, index) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'block rounded-xl px-3.5 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 lg:text-[13px]',
                          index === 0 && 'mt-1',
                        )}
                        onClick={() => setIsAccountOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <ProfileMenuSaldoItem
                      role={user.role}
                      size="sm"
                      className="mt-0 px-3.5 py-2 text-sm lg:text-[13px]"
                      onNavigate={() => setIsAccountOpen(false)}
                    />
                    {user.role === 'ADMIN' && (
                      <>
                        <Link
                          href="/admin/banners"
                          className="block rounded-xl px-3.5 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 lg:text-[13px]"
                          onClick={() => setIsAccountOpen(false)}
                        >
                          Banner
                        </Link>
                        <Link
                          href="/admin/notifications"
                          className="block rounded-xl px-3.5 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 lg:text-[13px]"
                          onClick={() => setIsAccountOpen(false)}
                        >
                          Notifikasi
                        </Link>
                      </>
                    )}
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 lg:text-[13px]"
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
            </motion.div>
          )}
        </div>
      </div>
    </header>
  )
}
