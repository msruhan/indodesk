'use client'

import { Badge } from '@/components/ui/badge'
import {
  SUPPORT_TICKET_CATEGORY_OPTIONS,
  SUPPORT_TICKET_PRIORITY_OPTIONS,
  SUPPORT_TICKET_STATUS_LABELS,
} from '@/lib/support-ticket-constants'
import type {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@prisma/client'
import { cn } from '@/lib/utils'

export function SupportTicketStatusBadge({ status }: { status: SupportTicketStatus }) {
  const variant =
    status === 'RESOLVED'
      ? 'success'
      : status === 'OPEN'
        ? 'warning'
        : status === 'WAITING_REPORTER'
          ? 'info'
          : 'default'

  return <Badge variant={variant}>{SUPPORT_TICKET_STATUS_LABELS[status]}</Badge>
}

export function SupportTicketPriorityBadge({ priority }: { priority: SupportTicketPriority }) {
  const variant =
    priority === 'URGENT'
      ? 'danger'
      : priority === 'HIGH'
        ? 'warning'
        : priority === 'LOW'
          ? 'default'
          : 'default'

  return (
    <Badge variant={variant}>
      {SUPPORT_TICKET_PRIORITY_OPTIONS.find((p) => p.value === priority)?.label ?? priority}
    </Badge>
  )
}

export function SupportTicketCategoryLabel({ category }: { category: SupportTicketCategory }) {
  const label =
    SUPPORT_TICKET_CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? category
  return <span>{label}</span>
}

export function supportTicketRowClass(selected: boolean) {
  return cn(
    'cursor-pointer rounded-xl border p-3 transition-colors',
    selected
      ? 'border-primary-300 bg-primary-50/60'
      : 'border-surface-200 bg-white hover:border-primary-200',
  )
}

export function formatTicketDate(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
