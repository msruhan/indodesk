import type { OrderStatus } from '@/data/topup-types'
import type { PublicTopupOrderDto } from '@/lib/topup-order-serializer'
import type { RiwayatTransaction, RiwayatTxStatus } from '@/lib/user-riwayat-orders'

function mapTopupStatus(status: OrderStatus): RiwayatTxStatus {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'pending-payment':
      return 'pending'
    case 'paid':
    case 'processing':
    case 'fulfilling':
      return 'in-progress'
  }
}

const topupStatusLabel: Record<OrderStatus, string> = {
  'pending-payment': 'Menunggu bayar',
  paid: 'Dibayar',
  processing: 'Diproses',
  fulfilling: 'Mengirim',
  completed: 'Selesai',
  failed: 'Gagal',
}

export function topupStatusLabelForUi(status: OrderStatus): string {
  return topupStatusLabel[status]
}

export function topupOrderToRiwayatTransaction(row: PublicTopupOrderDto): RiwayatTransaction {
  return {
    id: `topup-${row.id}`,
    type: 'topup',
    title: `${row.productName} · ${row.denominationLabel}`,
    subtitle: `${row.orderCode} · ${row.accountId}`,
    amount: row.total,
    status: mapTopupStatus(row.status),
    date: row.createdAt,
    href: `/topup/order/${row.orderCode}`,
  }
}

export async function fetchUserTopupRiwayat(): Promise<PublicTopupOrderDto[]> {
  const res = await fetch('/api/user/topup/orders', { cache: 'no-store' })
  if (res.status === 401) return []
  const json = await res.json()
  if (!res.ok || !json.success) return []
  return json.data ?? []
}
