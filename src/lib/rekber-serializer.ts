import type { RekberStatus, RekberTransaction, User } from '@prisma/client'
import { formatNotificationTimeLabel } from '@/lib/notification-display'

export type RekberUiStatus = 'pending' | 'held' | 'released' | 'disputed' | 'refunded'

export type RekberParty = Pick<User, 'id' | 'name' | 'email' | 'image'>

export type RekberTimelineEvent = {
  status: RekberUiStatus
  label: string
  at: string | null
}

export type RekberDto = {
  id: string
  orderCode: string
  buyerId: string
  buyerName: string
  buyerEmail: string | null
  sellerId: string
  sellerName: string
  sellerEmail: string | null
  amount: number
  fee: number
  totalHold: number
  status: RekberUiStatus
  statusLabel: string
  description: string | null
  note: string | null
  createdAt: string
  heldAt: string | null
  releasedAt: string | null
  disputedAt: string | null
  refundedAt: string | null
  dateLabel: string
  role: 'buyer' | 'seller' | 'admin' | 'viewer'
  canFund: boolean
  canRelease: boolean
  canDispute: boolean
  canCancel: boolean
  timeline: RekberTimelineEvent[]
  inspectionOrderId: string | null
  inspectionOrderCode: string | null
}

export type RekberStats = {
  total: number
  pending: number
  held: number
  released: number
  disputed: number
  refunded: number
}

export function mapRekberUiStatus(db: RekberStatus): RekberUiStatus {
  switch (db) {
    case 'PENDING':
      return 'pending'
    case 'HELD':
      return 'held'
    case 'RELEASED':
      return 'released'
    case 'DISPUTED':
      return 'disputed'
    case 'REFUNDED':
      return 'refunded'
  }
}

export function rekberStatusLabel(status: RekberUiStatus): string {
  switch (status) {
    case 'pending':
      return 'Menunggu pembayaran'
    case 'held':
      return 'Dana ditahan'
    case 'released':
      return 'Selesai'
    case 'disputed':
      return 'Dispute'
    case 'refunded':
      return 'Dikembalikan'
  }
}

function buildTimeline(row: RekberTransaction): RekberTimelineEvent[] {
  const ui = mapRekberUiStatus(row.status)
  const events: RekberTimelineEvent[] = [
    { status: 'pending', label: 'Dibuat', at: row.createdAt.toISOString() },
    { status: 'held', label: 'Dana ditahan', at: row.heldAt?.toISOString() ?? null },
    { status: 'released', label: 'Dana dilepas', at: row.releasedAt?.toISOString() ?? null },
    { status: 'disputed', label: 'Dispute', at: row.disputedAt?.toISOString() ?? null },
    { status: 'refunded', label: 'Refund', at: row.refundedAt?.toISOString() ?? null },
  ]
  return events.filter((e) => {
    if (e.status === 'pending') return true
    if (e.status === ui) return true
    return e.at != null
  })
}

type SerializeOpts = {
  viewerId?: string
  viewerRole?: 'USER' | 'TEKNISI' | 'ADMIN'
}

type RekberRow = RekberTransaction & {
  buyer: RekberParty
  seller: RekberParty
  inspectionOrder?: { orderCode: string } | null
}

export function serializeRekber(row: RekberRow, opts: SerializeOpts = {}): RekberDto {
  const status = mapRekberUiStatus(row.status)
  const amount = Number(row.amount)
  const fee = Number(row.fee)
  const totalHold = amount + fee

  let role: RekberDto['role'] = 'viewer'
  if (opts.viewerRole === 'ADMIN') role = 'admin'
  else if (opts.viewerId === row.buyerId) role = 'buyer'
  else if (opts.viewerId === row.sellerId) role = 'seller'

  const isBuyer = role === 'buyer'
  const isSeller = role === 'seller'
  const isAdmin = role === 'admin'

  return {
    id: row.id,
    orderCode: row.orderCode,
    buyerId: row.buyer.id,
    buyerName: row.buyer.name ?? 'Buyer',
    buyerEmail: row.buyer.email,
    sellerId: row.seller.id,
    sellerName: row.seller.name ?? 'Seller',
    sellerEmail: row.seller.email,
    amount,
    fee,
    totalHold,
    status,
    statusLabel: rekberStatusLabel(status),
    description: row.description,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    heldAt: row.heldAt?.toISOString() ?? null,
    releasedAt: row.releasedAt?.toISOString() ?? null,
    disputedAt: row.disputedAt?.toISOString() ?? null,
    refundedAt: row.refundedAt?.toISOString() ?? null,
    dateLabel: formatNotificationTimeLabel(row.updatedAt),
    role,
    canFund: isBuyer && row.status === 'PENDING',
    canRelease: isBuyer && row.status === 'HELD',
    canDispute: (isBuyer || isSeller) && row.status === 'HELD',
    canCancel: isBuyer && row.status === 'PENDING',
    timeline: buildTimeline(row),
    inspectionOrderId: row.inspectionOrderId,
    inspectionOrderCode: row.inspectionOrder?.orderCode ?? null,
  }
}

export function buildRekberStats(items: RekberDto[]): RekberStats {
  return {
    total: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    held: items.filter((i) => i.status === 'held').length,
    released: items.filter((i) => i.status === 'released').length,
    disputed: items.filter((i) => i.status === 'disputed').length,
    refunded: items.filter((i) => i.status === 'refunded').length,
  }
}
