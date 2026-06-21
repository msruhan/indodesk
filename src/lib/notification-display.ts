import type { ComponentType } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  MessageCircle,
  Package,
  Shield,
} from '@/lib/icons'
import type { NotificationIconKey, NotificationTone } from '@/data/mock-platform-notifications'

type IconComponent = ComponentType<{ className?: string }>

export const notificationIconMap: Record<NotificationIconKey, IconComponent> = {
  shield: Shield,
  message: MessageCircle,
  check: CheckCircle,
  bell: Bell,
  package: Package,
  warning: AlertTriangle,
}

export const notificationToneClass: Record<NotificationTone, string> = {
  primary: 'bg-primary-50 text-primary-700',
  warning: 'bg-amber-50 text-amber-700',
  success: 'bg-green-50 text-green-700',
  neutral: 'bg-surface-100 text-surface-700',
  danger: 'bg-red-50 text-red-700',
}

const KNOWN_ICONS = new Set<string>(Object.keys(notificationIconMap))
const KNOWN_TONES = new Set<string>(Object.keys(notificationToneClass))

export function resolveNotificationIcon(icon: string | undefined | null): NotificationIconKey {
  if (icon && KNOWN_ICONS.has(icon)) return icon as NotificationIconKey
  return 'bell'
}

export function resolveNotificationTone(tone: string | undefined | null): NotificationTone {
  if (tone && KNOWN_TONES.has(tone)) return tone as NotificationTone
  return 'primary'
}

/** Label waktu relatif (Bahasa Indonesia) dari timestamp ISO. */
export function formatNotificationTimeLabel(createdAt: string | Date): string {
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const diffMs = Date.now() - date.getTime()
  if (Number.isNaN(diffMs) || diffMs < 0) return 'Baru saja'

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}
