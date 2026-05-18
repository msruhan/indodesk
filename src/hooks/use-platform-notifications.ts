'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UserRole } from '@/contexts/auth-context'
import type { PlatformNotification } from '@/data/mock-platform-notifications'
import {
  notificationMatchesRole,
  sortNotificationsNewestFirst,
} from '@/lib/platform-notifications'
import {
  loadReadNotificationIds,
  mergeReadNotificationIds,
  subscribeNotificationReadState,
} from '@/lib/notification-read-state'

export function usePlatformNotifications(role: UserRole | undefined, userId?: string) {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadNotificationIds(userId))

  useEffect(() => {
    setReadIds(loadReadNotificationIds(userId))
  }, [userId])

  useEffect(() => {
    return subscribeNotificationReadState(() => {
      setReadIds(loadReadNotificationIds(userId))
    })
  }, [userId])

  const refresh = useCallback(async () => {
    if (!role) {
      setNotifications([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
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
    const interval = setInterval(() => void refresh(), 60_000)
    return () => clearInterval(interval)
  }, [refresh])

  const visible = useMemo(
    () => notifications.filter((n) => notificationMatchesRole(n, role)),
    [notifications, role],
  )

  const unreadNotifications = useMemo(
    () => visible.filter((n) => !readIds.has(n.id)),
    [visible, readIds],
  )

  const unreadCount = unreadNotifications.length

  const markAllAsRead = useCallback(() => {
    if (!userId || visible.length === 0) return
    const next = mergeReadNotificationIds(
      userId,
      visible.map((n) => n.id),
    )
    setReadIds(next)
  }, [userId, visible])

  const markAsRead = useCallback(
    (id: string) => {
      if (!userId) return
      const next = mergeReadNotificationIds(userId, [id])
      setReadIds(next)
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
    isRead: (id: string) => readIds.has(id),
  }
}
