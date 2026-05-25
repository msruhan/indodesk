import type { ProductListingStatus } from '@prisma/client'
import { formatNotificationTimeLabel } from '@/lib/notification-display'

export type ApprovalEntityType = 'product' | 'store' | 'teknisi'

export type ApprovalItemStatus = 'pending' | 'approved' | 'rejected'

export type ApprovalQueueItem = {
  id: string
  entityType: ApprovalEntityType
  type: 'Produk' | 'Toko' | 'Teknisi'
  status: ApprovalItemStatus
  name: string
  submitter: string
  description: string
  date: string
  createdAt: string
  thumbnailUrl?: string | null
}

const STATUS_SORT_ORDER: Record<ApprovalItemStatus, number> = {
  pending: 0,
  approved: 1,
  rejected: 2,
}

export function sortApprovalQueueItems(items: ApprovalQueueItem[]): ApprovalQueueItem[] {
  return [...items].sort((a, b) => {
    const byStatus = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export type ApprovalStats = {
  pending: number
  approved: number
  rejected: number
}

export function formatApprovalDate(createdAt: Date): string {
  return formatNotificationTimeLabel(createdAt)
}

export function truncateText(text: string | null | undefined, max = 120): string {
  if (!text?.trim()) return '—'
  const t = text.trim()
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

export type ApprovalStatusFilter = 'all' | ApprovalItemStatus

export type ApprovalTypeFilter = 'all' | ApprovalQueueItem['type']

export type ApprovalQueueFilters = {
  q?: string
  status?: ApprovalStatusFilter
  type?: ApprovalTypeFilter
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase()
}

export function filterApprovalQueueItems(
  items: ApprovalQueueItem[],
  filters: ApprovalQueueFilters,
): ApprovalQueueItem[] {
  const q = normalizeSearchText(filters.q ?? '')
  const status = filters.status ?? 'all'
  const type = filters.type ?? 'all'

  return items.filter((item) => {
    if (status !== 'all' && item.status !== status) return false
    if (type !== 'all' && item.type !== type) return false
    if (!q) return true

    const haystack = [item.name, item.description, item.submitter, item.type, item.date]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

export function countApprovalQueueByType(
  items: ApprovalQueueItem[],
): Record<ApprovalTypeFilter, number> {
  return {
    all: items.length,
    Produk: items.filter((i) => i.type === 'Produk').length,
    Toko: items.filter((i) => i.type === 'Toko').length,
    Teknisi: items.filter((i) => i.type === 'Teknisi').length,
  }
}
