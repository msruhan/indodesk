'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UserRole } from '@/contexts/auth-context'
import type { PlatformNotification } from '@/data/mock-platform-notifications'
import {
  notificationMatchesRole,
  sortNotificationsNewestFirst,
} from '@/lib/platform-notifications'
import {
  isNotificationRead,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotificationReadState,
} from '@/lib/notification-read-state'

const ADMIN_POLL_MS = 5_000
const TEKNISI_POLL_MS = 15_000
const DEFAULT_POLL_MS = 60_000

export function usePlatformNotifications(role: UserRole | undefined, userId?: string) {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [readVersion, setReadVersion] = useState(0)

  useEffect(() => {
    return subscribeNotificationReadState(() => {
      setReadVersion((v) => v + 1)
    })
  }, [])

  const refresh = useCallback(async () => {
    if (!role) {
      setNotifications([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?t=${Date.now()}`, {
        cache: 'no-store',
      })
      const json = (await res.json()) as {
        success?: boolean
        data?: PlatformNotification[]
      }
      if (res.ok && json.success && Array.isArray(json.data)) {
        setNotifications(sortNotificationsNewestFirst(json.data))
      } else {
        setNotifications([])
      }
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    void refresh()
    const pollMs =
      role === 'ADMIN' ? ADMIN_POLL_MS : role === 'TEKNISI' ? TEKNISI_POLL_MS : DEFAULT_POLL_MS
    const interval = setInterval(() => void refresh(), pollMs)
    return () => clearInterval(interval)
  }, [refresh, role])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const onFocus = () => void refresh()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  const visible = useMemo(
    () => notifications.filter((n) => notificationMatchesRole(n, role)),
    [notifications, role],
  )

  const isUnread = useCallback(
    (item: PlatformNotification) => {
      if (!userId) return true
      void readVersion
      return !isNotificationRead(userId, item.id, item.createdAt)
    },
    [userId, readVersion],
  )

  const unreadNotifications = useMemo(
    () => visible.filter((n) => isUnread(n)),
    [visible, isUnread],
  )

  const unreadCount = unreadNotifications.length

  const markAllAsRead = useCallback(() => {
    if (!userId || visible.length === 0) return
    markAllNotificationsRead(
      userId,
      visible.map((n) => ({ id: n.id, createdAt: n.createdAt })),
    )
    setReadVersion((v) => v + 1)
  }, [userId, visible])

  const markAsRead = useCallback(
    (id: string, createdAt?: string) => {
      if (!userId) return
      markNotificationRead(userId, id, createdAt)
      setReadVersion((v) => v + 1)
    },
    [userId],
  )

  return {
    notifications: visible,
    unreadNotifications,
    unreadCount,
    loading,
    refresh,
    markAllAsRead,
    markAsRead,
    isUnread,
  }
}
