import type { RekberDto } from '@/lib/rekber-serializer'
import { getUserActivityHref } from '@/lib/user-activity-href'
import type { RiwayatTransaction, RiwayatTxStatus } from '@/lib/user-riwayat-orders'

function mapRekberStatus(status: RekberDto['status']): RiwayatTxStatus {
  switch (status) {
    case 'released':
      return 'completed'
    case 'pending':
      return 'pending'
    case 'held':
      return 'in-progress'
    case 'disputed':
      return 'in-progress'
    case 'refunded':
      return 'failed'
  }
}

export function rekberToRiwayatTransaction(row: RekberDto): RiwayatTransaction {
  const counterparty =
    row.role === 'buyer' ? row.sellerName : row.role === 'seller' ? row.buyerName : row.sellerName
  return {
    id: `rekber-${row.id}`,
    type: 'rekber',
    title: row.description ?? `Rekber ${row.orderCode}`,
    subtitle: `${counterparty} · ${row.orderCode}`,
    amount: row.totalHold,
    status: mapRekberStatus(row.status),
    date: row.createdAt,
    href: getUserActivityHref('rekber'),
  }
}

export async function fetchUserRekberRiwayat(): Promise<RekberDto[]> {
  const res = await fetch('/api/rekber', { cache: 'no-store' })
  if (res.status === 401) return []
  const json = await res.json()
  if (!res.ok || !json.success) return []
  return json.data?.items ?? []
}
