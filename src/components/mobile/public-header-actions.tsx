'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, type UserRole } from '@/contexts/auth-context'
import { chatPathForRole, publicProfileMenuItemsForRole } from '@/lib/role-routes'
import { setChatBottomNavMode } from '@/lib/chat-bottom-nav'
import { notificationMatchesRole } from '@/data/mock-platform-notifications'
import {
  NOTIFICATIONS_UPDATED_EVENT,
  loadPlatformNotifications,
} from '@/lib/platform-content-storage'
import { notificationIconMap, notificationToneClass } from '@/lib/notification-display'
import { Bell, LogOut, MessageCircle, UserCircle } from '@/lib/icons'
import { cn } from '@/lib/utils'
import {
  headerActionsGroupClass,
  headerIconButtonClass,
  headerIconClass,
} from '@/components/mobile/header-action-styles'
import { HeaderCartLink } from '@/components/mobile/header-cart-link'

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function PublicHeaderActions() {
  const { user, isLoading, logout } = useAuth()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
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
    notificationMatchesRole(n, user?.role as UserRole | undefined),
  )

  const closeMenus = () => {
    setIsNotificationsOpen(false)
    setIsProfileOpen(false)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className={headerActionsGroupClass}>
      {user && (
        <>
          <Link
            href={chatPathForRole(user.role as UserRole)}
            className={headerIconButtonClass}
            aria-label="Chat"
            onClick={() => {
              setChatBottomNavMode('public')
              closeMenus()
            }}
          >
            <MessageCircle className={headerIconClass} />
          </Link>

          <button
            type="button"
            className={headerIconButtonClass}
            aria-label="Notifikasi"
            aria-expanded={isNotificationsOpen}
            onClick={() => {
              setIsNotificationsOpen((v) => !v)
              setIsProfileOpen(false)
            }}
          >
            <Bell className={headerIconClass} />
            {visibleNotifications.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {(user.role === 'USER' || user.role === 'TEKNISI') && (
            <HeaderCartLink onClick={closeMenus} />
          )}
        </>
      )}

      <button
        type="button"
        className={cn(
          headerIconButtonClass,
          isProfileOpen && 'border-primary-300 bg-primary-50/80 text-primary-700',
        )}
        aria-label={user ? 'Menu akun' : 'Masuk atau daftar'}
        aria-expanded={isProfileOpen}
        onClick={() => {
          setIsProfileOpen((v) => !v)
          setIsNotificationsOpen(false)
        }}
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

      <AnimatePresence>
        {user && isNotificationsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(100vw-2rem,300px)] rounded-2xl border border-surface-200/70 bg-white p-2 shadow-soft-lg"
          >
            <div className="flex items-center justify-between px-2 py-2">
              <p className="text-sm font-semibold text-ink">Notifikasi</p>
              {visibleNotifications.length > 0 && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                  {visibleNotifications.length}
                </span>
              )}
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {visibleNotifications.length === 0 ? (
                <p className="px-3 py-5 text-center text-sm text-surface-500">Tidak ada notifikasi</p>
              ) : (
                visibleNotifications.map((item) => {
                  const Icon = notificationIconMap[item.icon]
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 rounded-xl px-3 py-2"
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                          notificationToneClass[item.tone],
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{item.title}</span>
                        <span className="block text-xs text-surface-500 line-clamp-2">{item.body}</span>
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-surface-200/70 bg-white/95 shadow-soft-lg backdrop-blur-xl',
              user ? 'w-[11.5rem] rounded-xl shadow-soft-lg' : 'w-48',
            )}
          >
            {user ? (
              <div className="p-1.5">
                <div className="flex items-center gap-2 rounded-lg bg-surface-50/80 px-2.5 py-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-[10px] font-bold text-white">
                    {getInitials(user.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-[10px] text-surface-500">{user.email}</p>
                  </div>
                </div>
                {publicProfileMenuItemsForRole(user.role as UserRole).map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'block rounded-lg px-2.5 py-2 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50',
                      index === 0 && 'mt-1',
                    )}
                    onClick={() => setIsProfileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                  onClick={() => {
                    setIsProfileOpen(false)
                    void logout()
                  }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="p-1.5">
                <div className="mb-2 flex flex-col items-center rounded-lg bg-gradient-to-br from-primary-50 to-accent-50/50 px-3 py-2.5">
                  <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500">
                    <UserCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-center text-xs font-semibold text-ink">Selamat datang!</p>
                  <p className="mt-0.5 text-center text-[10px] leading-snug text-surface-500">
                    Masuk untuk akses penuh ke semua fitur
                  </p>
                </div>
                <Link
                  href="/login"
                  className="block rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-2 text-center text-xs font-semibold text-white transition-opacity hover:opacity-95"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="mt-1 block rounded-lg border border-surface-200 px-3 py-2 text-center text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Daftar
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
