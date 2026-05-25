'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { notificationIconMap, notificationToneClass, formatNotificationTimeLabel } from '@/lib/notification-display'
import type { PlatformNotification } from '@/data/mock-platform-notifications'

export function NotificationFeedItem({
  item,
  className,
  unread = false,
  onNavigate,
}: {
  item: PlatformNotification
  className?: string
  unread?: boolean
  onNavigate?: () => void
}) {
  const Icon = notificationIconMap[item.icon]
  const content = (
    <>
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
        <span className="mt-0.5 block text-[11px] text-surface-400">
          {formatNotificationTimeLabel(item.createdAt)}
        </span>
      </span>
    </>
  )

  const rowClass = cn(
    'flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-50',
    unread && 'bg-primary-50/60 ring-1 ring-primary-200/50',
    className,
  )

  if (item.href) {
    return (
      <Link href={item.href} className={rowClass} onClick={onNavigate}>
        {content}
      </Link>
    )
  }

  return <div className={rowClass}>{content}</div>
}
