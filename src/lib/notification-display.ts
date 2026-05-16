import type { ComponentType } from 'react'
import {
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
}

export const notificationToneClass: Record<NotificationTone, string> = {
  primary: 'bg-primary-50 text-primary-700',
  warning: 'bg-amber-50 text-amber-700',
  success: 'bg-green-50 text-green-700',
  neutral: 'bg-surface-100 text-surface-700',
}
