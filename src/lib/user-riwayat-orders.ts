import {
  mapApiOrder,
  mapApiServerOrder,
  type ImeiOrderStatusUi,
  type PublicImeiOrder,
  type PublicServerOrder,
} from '@/lib/imei-public'

export type RiwayatTxStatus = 'completed' | 'pending' | 'in-progress' | 'failed'

export type RiwayatTransactionType =
  | 'semua'
  | 'belanja'
  | 'konsultasi'
  | 'rekber'
  | 'remote'
  | 'perangkat'
  | 'server'

export type RiwayatTransaction = {
  id: string
  type: Exclude<RiwayatTransactionType, 'semua'>
  title: string
  subtitle: string
  amount: number
  status: RiwayatTxStatus
  date: string
  href?: string
}

function mapOrderStatus(status: ImeiOrderStatusUi): RiwayatTxStatus {
  switch (status) {
    case 'SUCCESS':
      return 'completed'
    case 'PENDING':
      return 'pending'
    case 'IN_PROCESS':
      return 'in-progress'
    default:
      return 'failed'
  }
}

export function imeiOrderToRiwayatTransaction(order: PublicImeiOrder): RiwayatTransaction {
  return {
    id: `imei-${order.id}`,
    type: 'perangkat',
    title: order.serviceName,
    subtitle: `${order.orderCode} · IMEI ${order.imei}`,
    amount: order.price,
    status: mapOrderStatus(order.status),
    date: order.createdAt,
    href: '/imei/orders',
  }
}

export function serverOrderToRiwayatTransaction(order: PublicServerOrder): RiwayatTransaction {
  return {
    id: `server-${order.id}`,
    type: 'server',
    title: order.serviceName,
    subtitle: order.boxName ? `${order.orderCode} · ${order.boxName}` : order.orderCode,
    amount: order.price,
    status: mapOrderStatus(order.status),
    date: order.createdAt,
    href: '/imei/orders?tab=server',
  }
}

export async function fetchUserImeiRiwayatOrders(): Promise<PublicImeiOrder[]> {
  const res = await fetch('/api/imei/orders', { cache: 'no-store' })
  if (res.status === 401) return []
  const json = await res.json()
  if (!res.ok || !json.success) return []
  return (json.data ?? []).map(mapApiOrder)
}

export async function fetchUserServerRiwayatOrders(): Promise<PublicServerOrder[]> {
  const res = await fetch('/api/imei/server-orders', { cache: 'no-store' })
  if (res.status === 401) return []
  const json = await res.json()
  if (!res.ok || !json.success) return []
  return (json.data ?? []).map(mapApiServerOrder)
}
