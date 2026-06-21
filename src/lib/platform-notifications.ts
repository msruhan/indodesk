import type { UserRole } from '@prisma/client'
import type { PlatformNotification as PrismaPlatformNotification } from '@prisma/client'
import type {
  NotificationAudience,
  PlatformNotification,
} from '@/data/mock-platform-notifications'
import { resolveNotificationIcon, resolveNotificationTone } from '@/lib/notification-display'

const AUDIENCES = ['USER', 'TEKNISI', 'ADMIN'] as const

export function parseNotificationAudiences(raw: unknown): NotificationAudience[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((a): a is NotificationAudience =>
    typeof a === 'string' && (AUDIENCES as readonly string[]).includes(a),
  )
}

export function serializeNotificationAudiences(audiences: NotificationAudience[]): string[] {
  return [...audiences]
}

export function mapDbNotification(row: PrismaPlatformNotification): PlatformNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audiences: parseNotificationAudiences(row.audiences),
    tone: resolveNotificationTone(row.tone),
    icon: resolveNotificationIcon(row.icon),
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    kind: 'broadcast',
  }
}

/** Notifikasi aktif untuk role tertentu, terbaru di atas. */
export function notificationMatchesRole(
  notification: PlatformNotification,
  role: UserRole | undefined,
): boolean {
  if (!notification.active) return false
  if (!role) return notification.audiences.includes('USER')
  return notification.audiences.includes(role as NotificationAudience)
}

export function sortNotificationsNewestFirst<T extends { createdAt: string }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}
