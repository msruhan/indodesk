import { randomBytes } from 'crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Order, OrderStatus, ProductCategory, UserRole } from '@prisma/client'
import QRCode from 'qrcode'
import { BRAND_WORDMARK_SRC } from '@/components/brand/brand-logo'
import { prisma } from '@/lib/db'
import { orderRequiresPhysicalPackaging } from '@/lib/marketplace-physical-order'
import { courierLabelFromBinderbyteCode } from '@/lib/shipping-courier'
import {
  formatShipOriginCityDisplay,
  loadTeknisiShipOrigin,
} from '@/lib/teknisi-ship-origin'

const LABEL_ELIGIBLE_STATUSES: OrderStatus[] = ['PROCESSING', 'SHIPPED']

export type ShippingLabelOrderRow = {
  id: string
  orderCode: string
  status: OrderStatus
  buyerId: string
  sellerId: string
  shippingAddress: string | null
  shippingPhone: string | null
  checkoutShippingCourier: string | null
  shippingService: string | null
  shippingLabelToken: string | null
  shippingLabelGeneratedAt: Date | null
  buyer: { name: string | null; phone: string | null }
  items: Array<{
    quantity: number
    product: { name: string; category: ProductCategory; weightKg: unknown }
  }>
}

export type ShippingLabelData = {
  orderCode: string
  qrUrl: string
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  senderName: string
  senderPhone: string
  senderAddress: string
  courierLabel: string
  serviceLabel: string | null
  totalWeightKg: number
  items: Array<{ name: string; quantity: number }>
  generatedAt: string
}

export function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

export function buildShippingLabelQrUrl(token: string): string {
  return `${getAppBaseUrl()}/l/${token}`
}

export function generateShippingLabelToken(): string {
  return randomBytes(24).toString('base64url')
}

export function orderEligibleForShippingLabel(
  order: Pick<ShippingLabelOrderRow, 'status' | 'shippingAddress' | 'items'>,
): boolean {
  if (!LABEL_ELIGIBLE_STATUSES.includes(order.status)) return false
  if (!order.shippingAddress?.trim()) return false
  return orderRequiresPhysicalPackaging(order.items)
}

export function canAccessShippingLabel(
  viewerId: string,
  viewerRole: UserRole,
  order: Pick<ShippingLabelOrderRow, 'buyerId' | 'sellerId'>,
): boolean {
  if (viewerRole === 'ADMIN') return true
  return viewerId === order.buyerId || viewerId === order.sellerId
}

export function resolveShippingLabelRedirect(
  order: Pick<ShippingLabelOrderRow, 'id' | 'buyerId' | 'sellerId'>,
  viewerId: string,
  viewerRole: UserRole,
): string | null {
  if (!canAccessShippingLabel(viewerId, viewerRole, order)) return null
  if (viewerRole === 'ADMIN') return '/admin/dashboard'
  if (viewerId === order.buyerId) return `/user/orders/${order.id}`
  if (viewerId === order.sellerId) return `/teknisi/pesanan?focus=${order.id}`
  return null
}

export async function ensureShippingLabelToken(orderId: string): Promise<string> {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { shippingLabelToken: true },
  })
  if (existing?.shippingLabelToken) return existing.shippingLabelToken

  for (let attempt = 0; attempt < 5; attempt++) {
    const token = generateShippingLabelToken()
    try {
      const updated = await prisma.order.update({
        where: { id: orderId, shippingLabelToken: null },
        data: {
          shippingLabelToken: token,
          shippingLabelGeneratedAt: new Date(),
        },
        select: { shippingLabelToken: true },
      })
      if (updated.shippingLabelToken) return updated.shippingLabelToken
    } catch {
      const row = await prisma.order.findUnique({
        where: { id: orderId },
        select: { shippingLabelToken: true },
      })
      if (row?.shippingLabelToken) return row.shippingLabelToken
    }
  }

  throw new Error('SHIPPING_LABEL_TOKEN_FAILED')
}

export async function buildLabelQrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(buildShippingLabelQrUrl(token), {
    width: 220,
    margin: 1,
    errorCorrectionLevel: 'M',
  })
}

let cachedWordmarkDataUrl: string | null = null

/** Wordmark PNG as data URL — aman untuk ImageResponse tanpa HTTP fetch. */
export async function loadBrandWordmarkDataUrl(): Promise<string> {
  if (cachedWordmarkDataUrl) return cachedWordmarkDataUrl
  const relative = BRAND_WORDMARK_SRC.replace(/^\//, '')
  const filePath = path.join(process.cwd(), 'public', relative)
  const buffer = await readFile(filePath)
  cachedWordmarkDataUrl = `data:image/png;base64,${buffer.toString('base64')}`
  return cachedWordmarkDataUrl
}

function formatWeightKg(total: number): number {
  return Math.round(total * 100) / 100
}

export async function buildShippingLabelData(
  order: ShippingLabelOrderRow,
  token: string,
): Promise<ShippingLabelData> {
  const [shipOrigin, store] = await Promise.all([
    loadTeknisiShipOrigin(order.sellerId),
    prisma.teknisiStore.findUnique({
      where: { userId: order.sellerId },
      select: { name: true, phone: true, address: true, city: true },
    }),
  ])

  const cityDisplay = formatShipOriginCityDisplay(shipOrigin.cityLabel) ?? store?.city ?? ''
  const street = shipOrigin.street?.trim() || store?.address?.trim() || ''
  const senderAddress = [street, cityDisplay].filter(Boolean).join(', ') || '—'

  const totalWeightKg = formatWeightKg(
    order.items.reduce(
      (sum, item) => sum + Number(item.product.weightKg ?? 1) * item.quantity,
      0,
    ),
  )

  const courierLabel =
    courierLabelFromBinderbyteCode(order.checkoutShippingCourier) ??
    order.checkoutShippingCourier?.toUpperCase() ??
    '—'

  return {
    orderCode: order.orderCode,
    qrUrl: buildShippingLabelQrUrl(token),
    recipientName: order.buyer.name?.trim() || 'Pembeli',
    recipientPhone: order.shippingPhone?.trim() || order.buyer.phone?.trim() || '—',
    recipientAddress: order.shippingAddress?.trim() || '—',
    senderName: store?.name?.trim() || 'Penjual Bantoo',
    senderPhone: store?.phone?.trim() || '—',
    senderAddress,
    courierLabel,
    serviceLabel: order.shippingService?.trim() || null,
    totalWeightKg,
    items: order.items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
    })),
    generatedAt: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
  }
}

export const SHIPPING_LABEL_ORDER_SELECT = {
  id: true,
  orderCode: true,
  status: true,
  buyerId: true,
  sellerId: true,
  shippingAddress: true,
  shippingPhone: true,
  checkoutShippingCourier: true,
  shippingService: true,
  shippingLabelToken: true,
  shippingLabelGeneratedAt: true,
  buyer: { select: { name: true, phone: true } },
  items: {
    include: {
      product: { select: { name: true, category: true, weightKg: true } },
    },
  },
} as const

export function canDownloadShippingLabelForSeller(
  order: Pick<Order, 'status' | 'shippingAddress'> & {
    items: ShippingLabelOrderRow['items']
  },
  role: 'buyer' | 'seller' | 'admin',
): boolean {
  if (role !== 'seller') return false
  return orderEligibleForShippingLabel(order)
}
