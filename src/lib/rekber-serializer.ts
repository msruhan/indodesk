import type { RekberPackagingMedia, RekberPackagingProof, RekberStatus, RekberTransaction, User, UserRole } from '@prisma/client'
import {
  deriveRekberSellerType,
  rekberSellerTypeLabel,
  type RekberSellerType,
} from '@/lib/rekber-seller-types'
import { formatNotificationTimeLabel } from '@/lib/notification-display'
import {
  serializeRekberPackagingProof,
  type OrderPackagingProofDto,
} from '@/lib/marketplace-packaging-proof-serializer'
import {
  serializeRekberComplaint,
  type RekberComplaintDto,
} from '@/lib/rekber-complaint-serializer'
import type { RekberComplaint, RekberComplaintMedia } from '@prisma/client'
import type { RekberTrackingDto } from '@/lib/rekber-tracking-sync'
import type { ShippingCourier } from '@prisma/client'
import { SHIPPING_COURIER_OPTIONS } from '@/lib/shipping-courier'

export type RekberUiStatus =
  | 'pending'
  | 'held'
  | 'processing'
  | 'shipped'
  | 'released'
  | 'disputed'
  | 'refunded'

export type RekberParty = Pick<User, 'id' | 'name' | 'email' | 'image' | 'role'>

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
  sellerType: RekberSellerType
  sellerTypeLabel: string
  amount: number
  fee: number
  totalHold: number
  status: RekberUiStatus
  statusLabel: string
  description: string | null
  note: string | null
  createdAt: string
  heldAt: string | null
  processedAt: string | null
  shippedAt: string | null
  releasedAt: string | null
  disputedAt: string | null
  refundedAt: string | null
  dateLabel: string
  role: 'buyer' | 'seller' | 'admin' | 'viewer'
  canFund: boolean
  canRelease: boolean
  canComplain: boolean
  canRespondComplaint: boolean
  canEscalateComplaint: boolean
  canWithdrawComplaint: boolean
  canCancel: boolean
  canUploadPackaging: boolean
  canAdvance: boolean
  canSetShipment: boolean
  requiresPackaging: boolean
  packagingProof: OrderPackagingProofDto | null
  tracking: RekberTrackingDto | null
  complaint: RekberComplaintDto | null
  timeline: RekberTimelineEvent[]
  inspectionOrderId: string | null
  inspectionOrderCode: string | null
}

export type RekberStats = {
  total: number
  pending: number
  held: number
  processing: number
  shipped: number
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
    case 'PROCESSING':
      return 'processing'
    case 'SHIPPED':
      return 'shipped'
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
    case 'processing':
      return 'Sedang diproses'
    case 'shipped':
      return 'Dalam pengiriman'
    case 'released':
      return 'Selesai'
    case 'disputed':
      return 'Dispute'
    case 'refunded':
      return 'Dikembalikan'
  }
}

function buildTimeline(row: Pick<RekberRow, 'status' | 'createdAt' | 'heldAt' | 'processedAt' | 'shippedAt' | 'releasedAt' | 'disputedAt' | 'refundedAt'>): RekberTimelineEvent[] {
  const ui = mapRekberUiStatus(row.status)
  const events: RekberTimelineEvent[] = [
    { status: 'pending', label: 'Dibuat', at: row.createdAt.toISOString() },
    { status: 'held', label: 'Dana ditahan', at: row.heldAt?.toISOString() ?? null },
    { status: 'processing', label: 'Diproses penjual', at: row.processedAt?.toISOString() ?? null },
    { status: 'shipped', label: 'Dikirim', at: row.shippedAt?.toISOString() ?? null },
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

function canUploadPackaging(
  isSeller: boolean,
  status: RekberStatus,
  proof: (RekberPackagingProof & { media: RekberPackagingMedia[] }) | null | undefined,
  hasComplaint: boolean,
): boolean {
  if (!isSeller || status !== 'HELD' || hasComplaint) return false
  if (!proof) return true
  if (proof.status === 'PENDING' || proof.status === 'APPROVED') return false
  if (proof.status === 'REJECTED') {
    if (!proof.resubmitDeadline) return true
    return proof.resubmitDeadline >= new Date()
  }
  return false
}

function buildTracking(row: Pick<RekberRow, 'trackingNumber' | 'shippingCourier' | 'trackingSummaryStatus' | 'trackingSummaryDesc' | 'trackingLastEventAt' | 'trackingLastSyncedAt' | 'trackingActive'>): RekberTrackingDto | null {
  if (!row.trackingNumber) return null
  const courier = row.shippingCourier as ShippingCourier | null
  return {
    courier,
    courierLabel: courier
      ? (SHIPPING_COURIER_OPTIONS.find((o) => o.value === courier)?.label ?? courier)
      : null,
    trackingNumber: row.trackingNumber,
    summaryStatus: row.trackingSummaryStatus ?? null,
    summaryDesc: row.trackingSummaryDesc ?? null,
    lastEventAt: row.trackingLastEventAt?.toISOString() ?? null,
    lastSyncedAt: row.trackingLastSyncedAt?.toISOString() ?? null,
    trackingActive: row.trackingActive ?? false,
  }
}

type SerializeOpts = {
  viewerId?: string
  viewerRole?: 'USER' | 'TEKNISI' | 'ADMIN'
}

type RekberRow = {
  id: string
  orderCode: string
  buyerId: string
  sellerId: string
  amount: RekberTransaction['amount']
  fee: RekberTransaction['fee']
  status: RekberStatus
  description: string | null
  note: string | null
  createdAt: Date
  updatedAt: Date
  heldAt: Date | null
  releasedAt: Date | null
  disputedAt: Date | null
  refundedAt: Date | null
  inspectionOrderId: string | null
  processedAt?: Date | null
  shippedAt?: Date | null
  shippingCourier?: RekberTransaction['shippingCourier']
  trackingNumber?: string | null
  trackingSummaryStatus?: string | null
  trackingSummaryDesc?: string | null
  trackingLastEventAt?: Date | null
  trackingLastSyncedAt?: Date | null
  trackingNextSyncAt?: Date | null
  trackingActive?: boolean
  trackingSyncFailures?: number
  buyer: RekberParty
  seller: RekberParty
  inspectionOrder?: { orderCode: string } | null
  complaint?: (RekberComplaint & { media: RekberComplaintMedia[] }) | null
  packagingProof?: (RekberPackagingProof & { media: RekberPackagingMedia[] }) | null
}

const COMPLAINABLE_STATUSES = new Set<RekberStatus>(['HELD', 'PROCESSING', 'SHIPPED'])

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
  const sellerType = deriveRekberSellerType((row.seller.role ?? 'USER') as UserRole)
  const complaint = row.complaint ? serializeRekberComplaint(row.complaint) : null
  const packagingProof = row.packagingProof
    ? serializeRekberPackagingProof(row.packagingProof)
    : null

  return {
    id: row.id,
    orderCode: row.orderCode,
    buyerId: row.buyer.id,
    buyerName: row.buyer.name ?? 'Buyer',
    buyerEmail: row.buyer.email,
    sellerId: row.seller.id,
    sellerName: row.seller.name ?? 'Seller',
    sellerEmail: row.seller.email,
    sellerType,
    sellerTypeLabel: rekberSellerTypeLabel(sellerType),
    amount,
    fee,
    totalHold,
    status,
    statusLabel: rekberStatusLabel(status),
    description: row.description,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    heldAt: row.heldAt?.toISOString() ?? null,
    processedAt: row.processedAt?.toISOString() ?? null,
    shippedAt: row.shippedAt?.toISOString() ?? null,
    releasedAt: row.releasedAt?.toISOString() ?? null,
    disputedAt: row.disputedAt?.toISOString() ?? null,
    refundedAt: row.refundedAt?.toISOString() ?? null,
    dateLabel: formatNotificationTimeLabel(row.updatedAt),
    role,
    canFund: isBuyer && row.status === 'PENDING',
    canRelease: isBuyer && row.status === 'SHIPPED' && !complaint,
    canComplain: isBuyer && COMPLAINABLE_STATUSES.has(row.status) && !complaint,
    canRespondComplaint:
      isSeller && complaint?.status === 'OPEN' && row.status === 'DISPUTED',
    canEscalateComplaint:
      isBuyer && complaint?.status === 'SELLER_RESPONDED' && row.status === 'DISPUTED',
    canWithdrawComplaint:
      isBuyer &&
      !!complaint &&
      (complaint.status === 'OPEN' || complaint.status === 'SELLER_RESPONDED'),
    canCancel: isBuyer && row.status === 'PENDING',
    canUploadPackaging: canUploadPackaging(isSeller, row.status, row.packagingProof, !!complaint),
    canAdvance:
      isSeller && row.status === 'HELD' && row.packagingProof?.status === 'APPROVED' && !complaint,
    canSetShipment: isSeller && row.status === 'PROCESSING' && !complaint,
    requiresPackaging: true,
    packagingProof,
    tracking: buildTracking(row),
    complaint,
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
    processing: items.filter((i) => i.status === 'processing').length,
    shipped: items.filter((i) => i.status === 'shipped').length,
    released: items.filter((i) => i.status === 'released').length,
    disputed: items.filter((i) => i.status === 'disputed').length,
    refunded: items.filter((i) => i.status === 'refunded').length,
  }
}
