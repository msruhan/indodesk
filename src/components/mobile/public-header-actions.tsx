'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, type UserRole } from '@/contexts/auth-context'
import { ProfileMenuSaldoItem } from '@/components/shared/profile-menu-saldo-item'
import { chatPathForRole, publicProfileMenuItemsForRole } from '@/lib/role-routes'
import { setChatBottomNavMode } from '@/lib/chat-bottom-nav'
import { usePlatformNotifications } from '@/hooks/use-platform-notifications'
import { NotificationFeedItem } from '@/components/shared/notification-feed-item'
import { Bell, LogOut, MessageCircle, UserCircle } from '@/lib/icons'
import { cn } from '@/lib/utils'
import {
  headerActionsGroupClass,
  headerIconButtonClass,
  headerIconClass,
} from '@/components/mobile/header-action-styles'
import { HeaderCartLink } from '@/components/mobile/header-cart-link'
import { useHeaderPopover } from '@/components/mobile/use-header-popover'

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

type PublicHeaderActionsProps = {
  hideProfileIcon?: boolean
}

export function PublicHeaderActions({ hideProfileIcon = false }: PublicHeaderActionsProps) {
  const { user, isLoading, logout } = useAuth()
  const notificationsPopover = useHeaderPopover()
  const profilePopover = useHeaderPopover()
  const [mounted, setMounted] = useState(false)
  const {
    notifications: visibleNotifications,
    unreadCount,
    markAllAsRead,
  } = usePlatformNotifications(user?.role as UserRole | undefined, user?.id)

  useEffect(() => {
    setMounted(true)
  }, [])

  const closeMenus = () => {
    notificationsPopover.closePopover()
    profilePopover.closePopover()
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const toggleNotifications = () => {
    if (notificationsPopover.open) {
      notificationsPopover.closePopover()
    } else {
      markAllAsRead()
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

  return (
    <div className={cn(headerActionsGroupClass, 'overflow-visible')}>
      {user && (
        <>
          <Link
            href={chatPathForRole(user.role as UserRole)}
            className={cn(headerIconButtonClass, 'lg:hidden')}
            aria-label="Chat"
            onClick={() => {
              setChatBottomNavMode('public')
              closeMenus()
            }}
          >
            <MessageCircle className={headerIconClass} />
          </Link>

          <button
            ref={notificationsPopover.anchorRef}
            type="button"
            className={headerIconButtonClass}
            aria-label="Notifikasi"
            aria-expanded={notificationsPopover.open}
            onClick={toggleNotifications}
          >
            <Bell className={headerIconClass} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {(user.role === 'USER' || user.role === 'TEKNISI') && (
            <HeaderCartLink onClick={closeMenus} />
          )}
        </>
      )}

      {!hideProfileIcon && (
        <button
          ref={profilePopover.anchorRef}
          type="button"
          className={cn(
            headerIconButtonClass,
            profilePopover.open && 'border-primary-300 bg-primary-50/80 text-primary-700',
          )}
          aria-label={user ? 'Menu akun' : 'Masuk atau daftar'}
          aria-expanded={profilePopover.open}
          onClick={toggleProfile}
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-pulse rounded-full bg-surface-300" />
          ) : user ? (
            user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-primary-700">{getInitials(user.name)}</span>
            )
          ) : (
            <UserCircle className={headerIconClass} />
          )}
        </button>
      )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {user && notificationsPopover.open && (
              <motion.div
                ref={notificationsPopover.panelRef}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={notificationsPopover.panelStyle}
                className="w-[min(100vw-2rem,300px)] rounded-2xl border border-surface-200/70 bg-white p-2 shadow-soft-lg"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <motion.div className="flex items-center justify-between px-2 py-2">
                  <p className="text-sm font-semibold text-ink">Notifikasi</p>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                      {unreadCount}
                    </span>
                  )}
                </motion.div>
                <motion.div className="max-h-64 space-y-1 overflow-y-auto">
                  {visibleNotifications.length === 0 ? (
                    <p className="px-3 py-5 text-center text-sm text-surface-500">Tidak ada notifikasi</p>
                  ) : (
                    visibleNotifications.map((item) => (
                      <NotificationFeedItem key={item.id} item={item} />
                    ))
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {mounted &&
        !hideProfileIcon &&
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
                className={cn(
                  'overflow-hidden rounded-xl border border-surface-200/70 bg-white shadow-soft-lg',
                  user ? 'w-[11.5rem]' : 'w-48',
                )}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {user ? (
                  <motion.div className="p-1.5">
                    <motion.div className="flex items-center gap-2 rounded-lg bg-surface-50/80 px-2.5 py-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-[10px] font-bold text-white">
                        {getInitials(user.name)}
                      </span>
                      <motion.div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
                        <p className="truncate text-[10px] text-surface-500">{user.email}</p>
                      </motion.div>
                    </motion.div>
                    {publicProfileMenuItemsForRole(user.role as UserRole).map((item, index) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'block rounded-lg px-2.5 py-2 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50',
                          index === 0 && 'mt-1',
                        )}
                        onClick={() => profilePopover.closePopover()}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <ProfileMenuSaldoItem
                      role={user.role as UserRole}
                      size="sm"
                      className="mt-0"
                      onNavigate={() => profilePopover.closePopover()}
                    />
                    <button
                      type="button"
                      className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                      onClick={() => {
                        profilePopover.closePopover()
                        void logout()
                      }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Keluar
                    </button>
                  </motion.div>
                ) : (
                  <motion.div className="p-1.5">
                    <motion.div className="mb-2 flex flex-col items-center rounded-lg bg-gradient-to-br from-primary-50 to-accent-50/50 px-3 py-2.5">
                      <motion.div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500">
                        <UserCircle className="h-4 w-4 text-white" />
                      </motion.div>
                      <p className="text-center text-xs font-semibold text-ink">Selamat datang!</p>
                      <p className="mt-0.5 text-center text-[10px] leading-snug text-surface-500">
                        Masuk untuk akses penuh ke semua fitur
                      </p>
                    </motion.div>
                    <Link
                      href="/login"
                      className="block rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-2 text-center text-xs font-semibold text-white transition-opacity hover:opacity-95"
                      onClick={() => profilePopover.closePopover()}
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      className="mt-1 block rounded-lg border border-surface-200 px-3 py-2 text-center text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50"
                      onClick={() => profilePopover.closePopover()}
                    >
                      Daftar
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
