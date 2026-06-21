import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'

export type MarketplaceInvoicePaymentStatus = 'paid' | 'unpaid' | 'cancelled'

export type MarketplaceInvoiceLine = {
  label: string
  amount: number
  negative?: boolean
  emphasis?: boolean
}

export type MarketplaceOrderInvoiceData = {
  invoiceNumber: string
  orderCode: string
  orderId: string
  issuedAt: string
  purchaseDate: string
  orderStatusLabel: string
  paymentStatus: MarketplaceInvoicePaymentStatus
  paymentStatusLabel: string
  paymentMethodLabel: string
  platformName: string
  buyer: { name: string; email: string | null }
  seller: { name: string }
  shippingAddress: string | null
  shippingPhone: string | null
  shippingCourierLabel: string | null
  shippingService: string | null
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }>
  summaryLines: MarketplaceInvoiceLine[]
  subtotalProducts: number
  totalShopping: number
  totalBill: number
}

export function formatInvoicePrice(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

export function formatInvoiceDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function resolvePaymentStatus(
  status: MarketplaceOrderDto['status'],
): MarketplaceInvoicePaymentStatus {
  if (status === 'awaiting_payment' || status === 'pending') return 'unpaid'
  if (status === 'cancelled' || status === 'refunded') return 'cancelled'
  return 'paid'
}

function paymentStatusLabel(status: MarketplaceInvoicePaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'LUNAS'
    case 'unpaid':
      return 'MENUNGGU PEMBAYARAN'
    case 'cancelled':
      return 'DIBATALKAN'
  }
}

export function resolvePaymentMethodLabel(
  paymentMethod?: 'WALLET' | 'PAYMENT_GATEWAY' | null,
  pgProvider?: string | null,
): string {
  if (paymentMethod === 'WALLET') return 'Saldo Bantoo'
  if (pgProvider?.toLowerCase() === 'tripay') return 'Payment Gateway (Tripay)'
  if (paymentMethod === 'PAYMENT_GATEWAY') return 'Payment Gateway'
  return 'Belum dibayar'
}

export function buildMarketplaceOrderInvoice(
  order: MarketplaceOrderDto,
  opts?: {
    platformName?: string
    paymentMethod?: 'WALLET' | 'PAYMENT_GATEWAY' | null
    pgProvider?: string | null
  },
): MarketplaceOrderInvoiceData {
  const paymentStatus = resolvePaymentStatus(order.status)
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  const summaryLines: MarketplaceInvoiceLine[] = [
    { label: 'Subtotal harga produk', amount: order.subtotal },
  ]

  if (order.discount > 0) {
    summaryLines.push({
      label: 'Diskon promo',
      amount: order.discount,
      negative: true,
    })
  }

  if (order.shippingCost > 0) {
    summaryLines.push({
      label: 'Total ongkos kirim',
      amount: order.shippingCost,
    })
  }

  const totalShopping =
    order.subtotal - order.discount + order.shippingCost

  summaryLines.push({
    label: 'Total belanja',
    amount: totalShopping,
    emphasis: true,
  })

  if (order.buyerFeePercentPart > 0) {
    summaryLines.push({
      label: 'Biaya platform',
      amount: order.buyerFeePercentPart,
    })
  }

  if (order.buyerFlatFeePart > 0) {
    summaryLines.push({
      label: `Biaya layanan (${order.buyerFlatFeePerItem.toLocaleString('id-ID')} × ${itemCount} item)`,
      amount: order.buyerFlatFeePart,
    })
  }

  summaryLines.push({
    label: 'Total tagihan',
    amount: order.buyerHoldAmount,
    emphasis: true,
  })

  return {
    invoiceNumber: order.orderCode,
    orderCode: order.orderCode,
    orderId: order.id,
    issuedAt: new Date().toISOString(),
    purchaseDate: order.createdAt,
    orderStatusLabel: order.statusLabel,
    paymentStatus,
    paymentStatusLabel: paymentStatusLabel(paymentStatus),
    paymentMethodLabel:
      paymentStatus === 'unpaid'
        ? 'Belum dibayar'
        : resolvePaymentMethodLabel(opts?.paymentMethod, opts?.pgProvider),
    platformName: opts?.platformName ?? 'Bantoo',
    buyer: {
      name: order.buyerName,
      email: order.buyerEmail,
    },
    seller: {
      name: order.sellerName,
    },
    shippingAddress: order.shippingAddress,
    shippingPhone: order.shippingPhone,
    shippingCourierLabel: order.checkoutShippingCourierLabel,
    shippingService: order.checkoutShippingService,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.lineTotal,
    })),
    summaryLines,
    subtotalProducts: order.subtotal,
    totalShopping,
    totalBill: order.buyerHoldAmount,
  }
}
