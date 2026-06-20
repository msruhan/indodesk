import type {
  Order,
  OrderComplaint,
  OrderComplaintMedia,
  OrderItem,
  OrderPackagingMedia,
  OrderPackagingProof,
  Product,
  ProductCategory,
  ShippingCourier,
  User,
} from '@prisma/client'
import { formatNotificationTimeLabel } from '@/lib/notification-display'
import { serializeOrderComplaint, type OrderComplaintDto, type SellerReturnAddressDto } from '@/lib/marketplace-order-complaint-serializer'
import {
  serializeOrderPackagingProof,
  type OrderPackagingProofDto,
} from '@/lib/marketplace-packaging-proof-serializer'
import { orderRequiresPhysicalPackaging } from '@/lib/marketplace-physical-order'
import { canDownloadShippingLabelForSeller } from '@/lib/shipping-label'
import { isTerminalTrackingStatus, SHIPPING_COURIER_OPTIONS, fromBinderbyteCourier, courierLabelFromBinderbyteCode } from '@/lib/shipping-courier'

export type MarketplaceOrderUiStatus =
  | 'awaiting_payment'
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'disputed'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export type MarketplaceOrderItemDto = {
  productId: string
  name: string
  quantity: number
  price: number
  lineTotal: number
}

export type MarketplaceOrderDto = {
  id: string
  orderCode: string
  buyerId: string
  buyerName: string
  buyerEmail: string | null
  buyerImage: string | null
  sellerId: string
  sellerName: string
  sellerImage: string | null
  items: MarketplaceOrderItemDto[]
  subtotal: number
  discount: number
  fee: number
  total: number
  status: MarketplaceOrderUiStatus
  statusLabel: string
  note: string | null
  createdAt: string
  dateLabel: string
  role: 'buyer' | 'seller' | 'admin'
  canAdvanceStatus: boolean
  canCancelOrder: boolean
  nextStatus: 'PROCESSING' | null
  requiresShipmentInput: boolean
  awaitingBuyerConfirmation: boolean
  tracking: {
    courier: ShippingCourier
    courierLabel: string
    trackingNumber: string
    summaryStatus: string | null
    lastSyncedAt: string | null
    trackingActive: boolean
  } | null
  shippingAddress: string | null
  shippingPhone: string | null
  shippingCost: number
  checkoutShippingCourier: string | null
  checkoutShippingCourierLabel: string | null
  checkoutShippingCourierEnum: ShippingCourier | null
  checkoutShippingService: string | null
  deliveredAt: string | null
  buyerActionDeadline: string | null
  autoCompletedAt: string | null
  completedAt: string | null
  canConfirmReceipt: boolean
  canFileComplaint: boolean
  canEscalateComplaint: boolean
  canRespondToComplaint: boolean
  canSubmitReturn: boolean
  canConfirmReturn: boolean
  canRejectReturn: boolean
  complaint: OrderComplaintDto | null
  canReview: boolean
  reviewedProductIds: string[]
  packagingProof: OrderPackagingProofDto | null
  requiresPackagingProof: boolean
  canSubmitPackagingProof: boolean
  canDownloadShippingLabel: boolean
}

type OrderRow = Order & {
  buyer: Pick<User, 'id' | 'name' | 'email' | 'image'>
  seller: Pick<User, 'id' | 'name' | 'email' | 'image'>
  items: (OrderItem & { product: Pick<Product, 'id' | 'name'> & { category?: ProductCategory } })[]
  complaint?: (OrderComplaint & { media: OrderComplaintMedia[] }) | null
  packagingProof?: (OrderPackagingProof & { media: OrderPackagingMedia[] }) | null
}

export function mapMarketplaceOrderUiStatus(db: Order['status']): MarketplaceOrderUiStatus {
  switch (db) {
    case 'AWAITING_PAYMENT':
      return 'awaiting_payment'
    case 'PENDING':
      return 'pending'
    case 'PAID':
      return 'paid'
    case 'PROCESSING':
      return 'processing'
    case 'SHIPPED':
      return 'shipped'
    case 'DISPUTED':
      return 'disputed'
    case 'COMPLETED':
      return 'completed'
    case 'CANCELLED':
      return 'cancelled'
    case 'REFUNDED':
      return 'refunded'
  }
}

export function marketplaceOrderStatusLabel(status: MarketplaceOrderUiStatus): string {
  switch (status) {
    case 'awaiting_payment':
      return 'Menunggu pembayaran'
    case 'pending':
      return 'Menunggu bayar'
    case 'paid':
      return 'Dibayar'
    case 'processing':
      return 'Diproses'
    case 'shipped':
      return 'Dikirim'
    case 'disputed':
      return 'Komplain'
    case 'completed':
      return 'Selesai'
    case 'cancelled':
      return 'Dibatalkan'
    case 'refunded':
      return 'Refund'
  }
}

function sellerNextStatus(db: Order['status']): MarketplaceOrderDto['nextStatus'] {
  if (db === 'PAID') return 'PROCESSING'
  return null
}

function courierLabel(code: ShippingCourier): string {
  return SHIPPING_COURIER_OPTIONS.find((o) => o.value === code)?.label ?? code
}

function isBeforeBuyerDeadline(deadline: Date | null | undefined): boolean {
  if (!deadline) return true
  return deadline > new Date()
}

export function serializeMarketplaceOrder(
  row: OrderRow,
  opts: {
    viewerId?: string
    viewerRole?: 'USER' | 'TEKNISI' | 'ADMIN'
    reviewedProductIds?: string[]
    sellerReturnAddress?: SellerReturnAddressDto | null
  },
): MarketplaceOrderDto {
  const status = mapMarketplaceOrderUiStatus(row.status)
  let role: MarketplaceOrderDto['role'] = 'buyer'
  if (opts.viewerRole === 'ADMIN') role = 'admin'
  else if (opts.viewerId === row.sellerId) role = 'seller'

  const items = row.items.map((i) => ({
    productId: i.productId,
    name: i.product.name,
    quantity: i.quantity,
    price: Number(i.price),
    lineTotal: Number(i.price) * i.quantity,
  }))

  const nextStatus = sellerNextStatus(row.status)
  const requiresShipmentInput = role === 'seller' && status === 'processing'
  const isPhysical = orderRequiresPhysicalPackaging(row.items)
  const packagingApproved = row.packagingProof?.status === 'APPROVED'
  const packagingPending = row.packagingProof?.status === 'PENDING'
  const packagingRejected = row.packagingProof?.status === 'REJECTED'
  const beforeResubmitDeadline =
    !row.packagingProof?.resubmitDeadline ||
    row.packagingProof.resubmitDeadline > new Date()

  const requiresPackagingProof =
    role === 'seller' &&
    row.status === 'PAID' &&
    isPhysical &&
    !packagingApproved

  const canSubmitPackagingProof =
    role === 'seller' &&
    row.status === 'PAID' &&
    isPhysical &&
    !packagingPending &&
    (!packagingRejected || beforeResubmitDeadline)

  const canDownloadShippingLabel = canDownloadShippingLabelForSeller(
    {
      status: row.status,
      shippingAddress: row.shippingAddress,
      items: row.items,
    },
    role,
  )

  const canAdvance =
    role === 'seller' &&
    nextStatus != null &&
    row.status === 'PAID' &&
    (!isPhysical || packagingApproved)
  const canCancelOrder =
    role === 'seller' && (row.status === 'PAID' || row.status === 'PROCESSING')

  const trackingDelivered = isTerminalTrackingStatus(row.trackingSummaryStatus)
  const isBuyer = role === 'buyer'
  const beforeDeadline = isBeforeBuyerDeadline(row.buyerActionDeadline)
  const hasComplaint = Boolean(row.complaint)

  const isAwaitingBuyerAction =
    row.status === 'SHIPPED' && trackingDelivered && !hasComplaint && beforeDeadline

  const canConfirmReceipt = isBuyer && isAwaitingBuyerAction
  const canFileComplaint = canConfirmReceipt

  const canEscalateComplaint =
    isBuyer && row.complaint?.status === 'SELLER_RESPONDED'

  const canRespondToComplaint =
    role === 'seller' &&
    row.complaint?.status === 'OPEN' &&
    row.complaint.sellerDeadline > new Date()

  const canSubmitReturn =
    isBuyer &&
    row.complaint?.status === 'AWAITING_RETURN' &&
    Boolean(row.complaint.returnDeadline && row.complaint.returnDeadline > new Date())

  const canConfirmReturn =
    role === 'seller' && row.complaint?.status === 'AWAITING_SELLER_CONFIRM'

  const canRejectReturn = canConfirmReturn

  const awaitingBuyerConfirmation =
    role === 'seller' && row.status === 'SHIPPED' && trackingDelivered && !hasComplaint

  const reviewedProductIds = opts.reviewedProductIds ?? []
  const canReview =
    isBuyer &&
    row.status === 'COMPLETED' &&
    row.items.some((i) => !reviewedProductIds.includes(i.productId))

  const tracking =
    row.trackingNumber && row.shippingCourier
      ? {
          courier: row.shippingCourier,
          courierLabel: courierLabel(row.shippingCourier),
          trackingNumber: row.trackingNumber,
          summaryStatus: row.trackingSummaryStatus,
          lastSyncedAt: row.trackingLastSyncedAt?.toISOString() ?? null,
          trackingActive: row.trackingActive,
        }
      : null

  const returnAddress =
    row.complaint?.status === 'AWAITING_RETURN' ? (opts.sellerReturnAddress ?? null) : null

  const complaintDto = row.complaint
    ? serializeOrderComplaint(row.complaint, { returnAddress })
    : null
  const packagingProofDto = row.packagingProof
    ? serializeOrderPackagingProof(row.packagingProof)
    : null

  return {
    id: row.id,
    orderCode: row.orderCode,
    buyerId: row.buyer.id,
    buyerName: row.buyer.name ?? 'Pembeli',
    buyerEmail: row.buyer.email,
    buyerImage: row.buyer.image,
    sellerId: row.seller.id,
    sellerName: row.seller.name ?? 'Penjual',
    sellerImage: row.seller.image,
    items,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    fee: Number(row.fee),
    total: Number(row.total),
    status,
    statusLabel: marketplaceOrderStatusLabel(status),
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    dateLabel: formatNotificationTimeLabel(row.updatedAt),
    role,
    canAdvanceStatus: canAdvance,
    canCancelOrder,
    nextStatus,
    requiresShipmentInput,
    awaitingBuyerConfirmation,
    tracking,
    shippingAddress: row.shippingAddress,
    shippingPhone: row.shippingPhone,
    shippingCost: Number(row.shippingCost),
    checkoutShippingCourier: row.checkoutShippingCourier,
    checkoutShippingCourierLabel: courierLabelFromBinderbyteCode(row.checkoutShippingCourier),
    checkoutShippingCourierEnum: fromBinderbyteCourier(row.checkoutShippingCourier),
    checkoutShippingService: row.shippingService,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    buyerActionDeadline: row.buyerActionDeadline?.toISOString() ?? null,
    autoCompletedAt: row.autoCompletedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    canConfirmReceipt,
    canFileComplaint,
    canEscalateComplaint,
    canRespondToComplaint,
    canSubmitReturn,
    canConfirmReturn,
    canRejectReturn,
    complaint: complaintDto,
    canReview,
    reviewedProductIds,
    packagingProof: packagingProofDto,
    requiresPackagingProof,
    canSubmitPackagingProof,
    canDownloadShippingLabel,
  }
}
