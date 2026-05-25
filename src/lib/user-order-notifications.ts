import { prisma } from '@/lib/db'
import { stripSupplierHtml } from '@/lib/imei-public'
import { formatIdr } from '@/lib/wallet-transactions'
import type {
  NotificationIconKey,
  NotificationTone,
  PlatformNotification,
} from '@/data/mock-platform-notifications'
import { sortNotificationsNewestFirst } from '@/lib/platform-notifications'
import type {
  ImeiOrder,
  ImeiOrderStatus,
  Order,
  OrderStatus,
  ServerOrder,
  ServerOrderStatus,
  TopupOrder,
  TopupStatus,
} from '@prisma/client'

const ORDER_LIMIT = 40

function clip(text: string, max = 140): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1)}…`
}

function orderNotification(
  partial: Omit<PlatformNotification, 'audiences' | 'active'>,
): PlatformNotification {
  return {
    ...partial,
    audiences: ['USER', 'TEKNISI', 'ADMIN'],
    active: true,
    kind: 'order',
  }
}

function topupStatusMessage(status: TopupStatus, orderCode: string, productLabel: string) {
  switch (status) {
    case 'PAID':
      return {
        title: 'Checkout top-up berhasil',
        body: `${orderCode} — ${productLabel}. Pembayaran diterima, pesanan diproses.`,
        tone: 'primary' as NotificationTone,
        icon: 'package' as NotificationIconKey,
      }
    case 'PROCESSING':
    case 'FULFILLING':
      return {
        title: 'Top-up sedang diproses',
        body: `${orderCode} — ${productLabel} sedang diproses ke provider.`,
        tone: 'warning' as NotificationTone,
        icon: 'package' as NotificationIconKey,
      }
    case 'COMPLETED':
      return {
        title: 'Transaksi top-up sukses',
        body: `${orderCode} — ${productLabel} telah berhasil dikirim.`,
        tone: 'success' as NotificationTone,
        icon: 'check' as NotificationIconKey,
      }
    case 'FAILED':
      return {
        title: 'Transaksi top-up gagal',
        body: `${orderCode} — ${productLabel} tidak dapat diselesaikan. Hubungi support jika perlu.`,
        tone: 'neutral' as NotificationTone,
        icon: 'bell' as NotificationIconKey,
      }
    default:
      return null
  }
}

function shopStatusMessage(
  status: OrderStatus,
  orderCode: string,
  productName: string,
  total: number,
) {
  const price = formatIdr(total)
  switch (status) {
    case 'PAID':
      return {
        title: 'Checkout marketplace berhasil',
        body: `${orderCode} — ${productName} (${price}). Pembayaran berhasil.`,
        tone: 'primary' as NotificationTone,
        icon: 'package' as NotificationIconKey,
      }
    case 'PROCESSING':
      return {
        title: 'Pesanan marketplace diproses',
        body: `${orderCode} — ${productName} sedang disiapkan penjual.`,
        tone: 'warning' as NotificationTone,
        icon: 'package' as NotificationIconKey,
      }
    case 'SHIPPED':
      return {
        title: 'Pesanan marketplace dikirim',
        body: `${orderCode} — ${productName} sedang dalam perjalanan.`,
        tone: 'primary' as NotificationTone,
        icon: 'package' as NotificationIconKey,
      }
    case 'COMPLETED':
      return {
        title: 'Transaksi marketplace sukses',
        body: `${orderCode} — ${productName} selesai (${price}).`,
        tone: 'success' as NotificationTone,
        icon: 'check' as NotificationIconKey,
      }
    case 'CANCELLED':
    case 'REFUNDED':
      return {
        title: 'Pesanan marketplace dibatalkan',
        body: `${orderCode} — ${productName} status: ${status === 'REFUNDED' ? 'refund' : 'batal'}.`,
        tone: 'neutral' as NotificationTone,
        icon: 'bell' as NotificationIconKey,
      }
    default:
      return null
  }
}

function imeiStatusMessage(
  status: ImeiOrderStatus,
  orderCode: string,
  serviceTitle: string,
  code?: string | null,
  comments?: string | null,
) {
  switch (status) {
    case 'IN_PROCESS':
      return {
        title: 'Order perangkat diproses supplier',
        body: `${orderCode} — ${serviceTitle} sedang diproses di supplier.`,
        tone: 'warning' as NotificationTone,
        icon: 'package' as NotificationIconKey,
      }
    case 'SUCCESS': {
      const result = code?.trim() ? ` Hasil: ${clip(code, 80)}` : ''
      return {
        title: 'Order perangkat sukses',
        body: clip(`${orderCode} — ${serviceTitle} selesai dari supplier.${result}`),
        tone: 'success' as NotificationTone,
        icon: 'check' as NotificationIconKey,
      }
    }
    case 'REJECTED': {
      const reason = stripSupplierHtml(comments || '') || 'Ditolak supplier'
      return {
        title: 'Order perangkat gagal',
        body: clip(`${orderCode} — ${serviceTitle}. ${reason}`),
        tone: 'neutral' as NotificationTone,
        icon: 'bell' as NotificationIconKey,
      }
    }
    case 'CANCELLED':
      return {
        title: 'Order perangkat dibatalkan',
        body: `${orderCode} — ${serviceTitle} dibatalkan.`,
        tone: 'neutral' as NotificationTone,
        icon: 'bell' as NotificationIconKey,
      }
    default:
      return null
  }
}

function serverStatusMessage(
  status: ServerOrderStatus,
  orderCode: string,
  serviceTitle: string,
  code?: string | null,
  comments?: string | null,
) {
  switch (status) {
    case 'IN_PROCESS':
      return {
        title: 'Order server diproses supplier',
        body: `${orderCode} — ${serviceTitle} sedang diproses di supplier.`,
        tone: 'warning' as NotificationTone,
        icon: 'package' as NotificationIconKey,
      }
    case 'SUCCESS': {
      const result = code?.trim() ? ` Hasil: ${clip(code, 80)}` : ''
      return {
        title: 'Order server sukses',
        body: clip(`${orderCode} — ${serviceTitle} selesai dari supplier.${result}`),
        tone: 'success' as NotificationTone,
        icon: 'check' as NotificationIconKey,
      }
    }
    case 'REJECTED': {
      const reason = stripSupplierHtml(comments || '') || 'Ditolak supplier'
      return {
        title: 'Order server gagal',
        body: clip(`${orderCode} — ${serviceTitle}. ${reason}`),
        tone: 'neutral' as NotificationTone,
        icon: 'bell' as NotificationIconKey,
      }
    }
    case 'CANCELLED':
      return {
        title: 'Order server dibatalkan',
        body: `${orderCode} — ${serviceTitle} dibatalkan.`,
        tone: 'neutral' as NotificationTone,
        icon: 'bell' as NotificationIconKey,
      }
    default:
      return null
  }
}

function mapTopup(order: TopupOrder): PlatformNotification | null {
  const productLabel = order.productSlug.replace(/-/g, ' ')
  const msg = topupStatusMessage(order.status, order.orderCode, productLabel)
  if (!msg) return null
  return orderNotification({
    id: `order-topup-${order.id}`,
    title: msg.title,
    body: msg.body,
    tone: msg.tone,
    icon: msg.icon,
    createdAt: (order.updatedAt ?? order.createdAt).toISOString(),
    href: order.orderCode ? `/topup/order/${order.orderCode}` : '/topup/cek-transaksi',
  })
}

function mapShop(
  order: Order & { items: { product: { name: string } }[] },
): PlatformNotification | null {
  const productName = order.items[0]?.product?.name ?? 'Produk marketplace'
  const total = Number(order.total.toString())
  const msg = shopStatusMessage(order.status, order.orderCode, productName, total)
  if (!msg) return null
  return orderNotification({
    id: `order-shop-${order.id}`,
    title: msg.title,
    body: msg.body,
    tone: msg.tone,
    icon: msg.icon,
    createdAt: order.updatedAt.toISOString(),
    href: '/user/orders',
  })
}

function mapImei(
  order: ImeiOrder & { service: { title: string } },
): PlatformNotification | null {
  const msg = imeiStatusMessage(
    order.status,
    order.orderCode,
    order.service.title,
    order.code,
    order.comments,
  )
  if (!msg) return null
  return orderNotification({
    id: `order-imei-${order.id}`,
    title: msg.title,
    body: msg.body,
    tone: msg.tone,
    icon: msg.icon,
    createdAt: order.updatedAt.toISOString(),
    href: '/user/orders/imei',
  })
}

function mapServer(
  order: ServerOrder & { service: { title: string } },
): PlatformNotification | null {
  const msg = serverStatusMessage(
    order.status,
    order.orderCode,
    order.service.title,
    order.code,
    order.comments,
  )
  if (!msg) return null
  return orderNotification({
    id: `order-server-${order.id}`,
    title: msg.title,
    body: msg.body,
    tone: msg.tone,
    icon: msg.icon,
    createdAt: order.updatedAt.toISOString(),
    href: '/user/orders/imei?tab=server',
  })
}

/** Notifikasi dinamis dari status order user (topup, shop, perangkat, server). */
export async function fetchOrderNotificationsForUser(userId: string): Promise<PlatformNotification[]> {
  const [topups, shops, imeis, servers] = await Promise.all([
    prisma.topupOrder.findMany({
      where: {
        userId,
        status: { in: ['PAID', 'PROCESSING', 'FULFILLING', 'COMPLETED', 'FAILED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: ORDER_LIMIT,
    }),
    prisma.order.findMany({
      where: {
        buyerId: userId,
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: ORDER_LIMIT,
      include: {
        items: {
          take: 1,
          include: { product: { select: { name: true } } },
        },
      },
    }),
    prisma.imeiOrder.findMany({
      where: {
        userId,
        status: { in: ['IN_PROCESS', 'SUCCESS', 'REJECTED', 'CANCELLED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: ORDER_LIMIT,
      include: { service: { select: { title: true } } },
    }),
    prisma.serverOrder.findMany({
      where: {
        userId,
        status: { in: ['IN_PROCESS', 'SUCCESS', 'REJECTED', 'CANCELLED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: ORDER_LIMIT,
      include: { service: { select: { title: true } } },
    }),
  ])

  const items: PlatformNotification[] = []
  for (const o of topups) {
    const n = mapTopup(o)
    if (n) items.push(n)
  }
  for (const o of shops) {
    const n = mapShop(o)
    if (n) items.push(n)
  }
  for (const o of imeis) {
    const n = mapImei(o)
    if (n) items.push(n)
  }
  for (const o of servers) {
    const n = mapServer(o)
    if (n) items.push(n)
  }

  return sortNotificationsNewestFirst(items)
}
