import type { Order, OrderItem, Product, ShippingCourier, User } from '@prisma/client'
import { formatNotificationTimeLabel } from '@/lib/notification-display'
import { SHIPPING_COURIER_OPTIONS } from '@/lib/shipping-courier'

export type MarketplaceOrderUiStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
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
  nextStatus: 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | null
  /** Opsi A: wajib input resi saat status processing */
  requiresShipmentInput: boolean
  tracking: {
    courier: ShippingCourier
    courierLabel: string
    trackingNumber: string
    summaryStatus: string | null
    lastSyncedAt: string | null
    trackingActive: boolean
  } | null
}

type OrderRow = Order & {
  buyer: Pick<User, 'id' | 'name' | 'email' | 'image'>
  seller: Pick<User, 'id' | 'name' | 'email' | 'image'>
  items: (OrderItem & { product: Pick<Product, 'id' | 'name'> })[]
}

export function mapMarketplaceOrderUiStatus(db: Order['status']): MarketplaceOrderUiStatus {
  switch (db) {
    case 'PENDING':
      return 'pending'
    case 'PAID':
      return 'paid'
    case 'PROCESSING':
      return 'processing'
    case 'SHIPPED':
      return 'shipped'
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
    case 'pending':
      return 'Menunggu bayar'
    case 'paid':
      return 'Dibayar'
    case 'processing':
      return 'Diproses'
    case 'shipped':
      return 'Dikirim'
    case 'completed':
      return 'Selesai'
    case 'cancelled':
      return 'Dibatalkan'
    case 'refunded':
      return 'Refund'
  }
}

function sellerNextStatus(db: Order['status']): MarketplaceOrderDto['nextStatus'] {
  switch (db) {
    case 'PAID':
      return 'PROCESSING'
    case 'SHIPPED':
      return 'COMPLETED'
    default:
      return null
  }
}

function courierLabel(code: ShippingCourier): string {
  return SHIPPING_COURIER_OPTIONS.find((o) => o.value === code)?.label ?? code
}

export function serializeMarketplaceOrder(
  row: OrderRow,
  opts: { viewerId?: string; viewerRole?: 'USER' | 'TEKNISI' | 'ADMIN' },
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
  const canAdvance =
    role === 'seller' && nextStatus != null && (row.status === 'PAID' || row.status === 'SHIPPED')
  const canCancelOrder =
    role === 'seller' && (row.status === 'PAID' || row.status === 'PROCESSING')

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
    tracking,
  }
}
