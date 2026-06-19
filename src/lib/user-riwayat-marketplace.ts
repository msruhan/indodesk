import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'
import { getUserActivityHref } from '@/lib/user-activity-href'
import type { RiwayatTransaction, RiwayatTxStatus } from '@/lib/user-riwayat-orders'

function mapMarketplaceStatus(status: MarketplaceOrderDto['status']): RiwayatTxStatus {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'awaiting_payment':
    case 'pending':
    case 'paid':
      return 'pending'
    case 'processing':
    case 'shipped':
    case 'disputed':
      return 'in-progress'
    case 'cancelled':
    case 'refunded':
      return 'failed'
  }
}

export function marketplaceOrderToRiwayatTransaction(row: MarketplaceOrderDto): RiwayatTransaction {
  const productNames = row.items.map((i) => i.name).join(', ')
  return {
    id: `belanja-${row.id}`,
    type: 'belanja',
    title: productNames || `Order ${row.orderCode}`,
    subtitle: `${row.sellerName} · ${row.orderCode}`,
    amount: row.total,
    status: mapMarketplaceStatus(row.status),
    date: row.createdAt,
    href: getUserActivityHref('belanja', row.id),
  }
}

export async function fetchUserMarketplaceRiwayat(): Promise<MarketplaceOrderDto[]> {
  const res = await fetch('/api/user/marketplace/orders', { cache: 'no-store' })
  if (res.status === 401) return []
  const json = await res.json()
  if (!res.ok || !json.success) return []
  return json.data ?? []
}
