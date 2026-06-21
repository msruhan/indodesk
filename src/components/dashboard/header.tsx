'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DashboardSmartSearch } from '@/components/dashboard/dashboard-smart-search'
import { BrandLogo } from '@/components/brand/brand-logo'
import { useAuth, type User, type UserRole } from '@/contexts/auth-context'
import { Bell, ChevronDown, LogOut, MessageCircle } from '@/lib/icons'
import { HeaderProfileTriggerIcon } from '@/components/mobile/header-profile-trigger-icon'
import { WalletBalanceButton } from '@/components/dashboard/wallet-balance-button'
import { usePlatformNotifications } from '@/hooks/use-platform-notifications'
import { NotificationFeedItem } from '@/components/shared/notification-feed-item'
import { ProfileMenuSaldoItem } from '@/components/shared/profile-menu-saldo-item'
import { MARKETPLACE_PATH, homePathForRole, profileMenuItemsForRole } from '@/lib/role-routes'
import { setUserNavHomeMode } from '@/lib/user-nav-home'
import { setChatBottomNavMode } from '@/lib/chat-bottom-nav'
import {
  headerActionsGroupClass,
  headerIconButtonClass,
  headerIconClass,
  mobileHeaderBarRowClass,
  mobileHeaderBarRowDesktopClass,
  mobileHeaderLogoWordmarkClass,
} from '@/components/mobile/header-action-styles'
import { HeaderCartLink } from '@/components/mobile/header-cart-link'
import { useHeaderPopover } from '@/components/mobile/use-header-popover'
import {
  isTabActive,
  SectionTabDropdown,
  type SectionTab,
} from '@/components/mobile/section-tabs'

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

export function DashboardHeader({
  mobileSectionTabs,
}: {
  /** Mobile-only section switcher (e.g. Layanan tabs) shown beside logo. */
  mobileSectionTabs?: SectionTab[]
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const notificationsPopover = useHeaderPopover<HTMLButtonElement>({
    estimatedWidth: 320,
  })
  const profilePopover = useHeaderPopover<HTMLDivElement>({
    estimatedWidth: 208,
  })
  const [mounted, setMounted] = useState(false)
  const {
    notifications: visibleNotifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    isUnread,
    refresh: refreshNotifications,
  } = usePlatformNotifications(user?.role, user?.id)

  useEffect(() => {
    setMounted(true)
  }, [])

  const closeMenus = () => {
    notificationsPopover.closePopover()
    profilePopover.closePopover()
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleNotifications = () => {
    if (notificationsPopover.open) {
      notificationsPopover.closePopover()
      markAllAsRead()
    } else {
      void refreshNotifications()
      notificationsPopover.openPopover()
      profilePopover.closePopover()
    }
  }

  const toggleProfile = () => {
    if (profilePopover.open) {
      profilePopover.closePopover()
    } else {
      profilePopover.openPopover()
      notificationsPopover.closePopover()
    }
  }

  const showMobileSectionNav =
    mobileSectionTabs != null && mobileSectionTabs.length >= 2

  return (
    <header className="sticky top-0 z-30 border-b border-surface-200/60 bg-white/75 backdrop-blur-xl">
      <div
        className={cn(
          mobileHeaderBarRowClass,
          mobileHeaderBarRowDesktopClass,
          'grid gap-2 lg:flex lg:items-center lg:gap-4',
          'grid-cols-[auto_minmax(0,1fr)]',
        )}
      >
        {user ? (
          <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-1.5 lg:hidden">
            <Link
              href={homePathForRole(user.role)}
              className="inline-flex shrink-0 items-center"
              aria-label="Beranda dashboard"
            >
              <BrandLogo variant="wordmark" wordmarkClassName={mobileHeaderLogoWordmarkClass} />
            </Link>
            {showMobileSectionNav && (
              <SectionTabDropdown
                tabs={mobileSectionTabs}
                isMerged={false}
                isActive={(tab) => isTabActive(tab, pathname)}
              />
            )}
          </div>
        ) : null}

        <div className="col-span-2 row-start-2 min-w-0 lg:col-span-1 lg:row-start-1 lg:flex-1">
          <DashboardSmartSearch role={user?.role ?? 'USER'} />
        </div>

        <div
          className={cn(
            headerActionsGroupClass,
            'col-start-2 row-start-1 justify-self-end overflow-visible lg:col-start-auto lg:row-start-1',
          )}
        >
          <WalletBalanceButton />

          <Link
            href={user?.role ? getChatHref(user.role) : '/login'}
            className={cn(headerIconButtonClass, 'hover:text-primary-700 lg:hidden')}
            aria-label="Chat"
            onClick={() => {
              setChatBottomNavMode('dashboard')
              closeMenus()
            }}
          >
            <MessageCircle className={headerIconClass} />
          </Link>

          <button
            ref={notificationsPopover.anchorRef}
            type="button"
            onClick={toggleNotifications}
            className={headerIconButtonClass}
            aria-label="Notifications"
            aria-expanded={notificationsPopover.open}
          >
            <Bell className={headerIconClass} />
            {unreadCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
                aria-hidden
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {user && (user.role === 'USER' || user.role === 'TEKNISI') && (
            <HeaderCartLink onClick={closeMenus} />
          )}

          {user && (
            <div ref={profilePopover.anchorRef} className="relative flex items-center">
              <button
                type="button"
                onClick={toggleProfile}
                className={cn(
                  headerIconButtonClass,
                  'lg:hidden',
                  profilePopover.open && 'border-primary-300 bg-primary-50/80 text-primary-700',
                )}
                aria-label="Menu akun"
                aria-expanded={profilePopover.open}
              >
                <HeaderProfileTriggerIcon isLoggedIn />
              </button>

              <button
                type="button"
                onClick={toggleProfile}
                className={cn(
                  'hidden items-center gap-2.5 rounded-full border border-surface-200/70 bg-white/70 py-1.5 pl-1.5 pr-3 shadow-soft-xs transition-colors hover:bg-white lg:flex',
                  profilePopover.open && 'border-primary-300 bg-primary-50/80',
                )}
                aria-label="Menu akun"
                aria-expanded={profilePopover.open}
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
                    profilePopover.open && 'rotate-180',
                  )}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {notificationsPopover.open && (
              <motion.div
                ref={notificationsPopover.panelRef}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={notificationsPopover.panelStyle}
                className="w-[min(100vw-2rem,320px)] rounded-2xl border border-surface-200/70 bg-white p-2 shadow-soft-lg"
              >
                <motion.div className="flex items-center justify-between px-2 py-2">
                  <motion.div>
                    <p className="text-sm font-semibold text-ink">Notification center</p>
                    <p className="text-xs text-surface-500">
                      {user?.role === 'ADMIN'
                        ? 'Alert operasional platform'
                        : user?.role === 'TEKNISI'
                          ? 'Order, chat, dan layanan'
                          : 'Pesanan, promo, dan aktivitas'}
                    </p>
                  </motion.div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                      onClick={markAllAsRead}
                    >
                      {unreadCount} baru
                    </button>
                  )}
                </motion.div>
                <motion.div className="max-h-72 space-y-1 overflow-y-auto">
                  {visibleNotifications.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-surface-500">Tidak ada notifikasi</p>
                  ) : (
                    visibleNotifications.map((item) => (
                      <NotificationFeedItem
                        key={`${item.id}:${item.createdAt}`}
                        item={item}
                        unread={isUnread(item)}
                        onNavigate={() => {
                          markAsRead(item.id, item.createdAt)
                          notificationsPopover.closePopover()
                        }}
                      />
                    ))
                  )}
                </motion.div>
                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin/monitoring"
                    className="mt-1 block rounded-xl px-3 py-2 text-center text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50"
                    onClick={() => notificationsPopover.closePopover()}
                  >
                    Buka halaman Monitoring
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {mounted &&
        user &&
        createPortal(
          <AnimatePresence>
            {profilePopover.open && (
              <motion.div
                ref={profilePopover.panelRef}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={profilePopover.panelStyle}
                className="w-[min(100vw-2rem,13rem)] overflow-hidden rounded-2xl border border-surface-200/70 bg-white/95 p-1.5 shadow-soft-lg backdrop-blur-xl lg:min-w-[13rem]"
              >
                <motion.div className="border-b border-surface-200/60 px-3.5 py-2.5">
                  <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-xs text-surface-500">{user.email}</p>
                </motion.div>
                {profileMenuItemsForRole(user.role, pathname).map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'block rounded-xl px-3.5 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 lg:text-[13px]',
                      index === 0 && 'mt-1',
                    )}
                    onClick={() => {
                      if (user.role === 'USER' && item.href === MARKETPLACE_PATH) {
                        setUserNavHomeMode('market')
                      }
                      profilePopover.closePopover()
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
                <ProfileMenuSaldoItem
                  role={user.role}
                  size="sm"
                  className="mt-0 px-3.5 py-2 text-sm lg:text-[13px]"
                  onNavigate={() => profilePopover.closePopover()}
                />
                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      href="/admin/banners"
                      className="block rounded-xl px-3.5 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 lg:text-[13px]"
                      onClick={() => profilePopover.closePopover()}
                    >
                      Banner
                    </Link>
                    <Link
                      href="/admin/notifications"
                      className="block rounded-xl px-3.5 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 lg:text-[13px]"
                      onClick={() => profilePopover.closePopover()}
                    >
                      Notifikasi
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 lg:text-[13px]"
                  onClick={() => {
                    profilePopover.closePopover()
                    void logout()
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </header>
  )
}
