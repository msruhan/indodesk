import type { InspectionOrderDto } from '@/lib/inspection-serializer'
import { getUserActivityHref } from '@/lib/user-activity-href'
import type { RiwayatTransaction, RiwayatTxStatus } from '@/lib/user-riwayat-orders'

function mapInspectionStatus(status: InspectionOrderDto['status']): RiwayatTxStatus {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'waiting':
      return 'pending'
    case 'rejected':
    case 'cancelled':
      return 'failed'
    default:
      return 'in-progress'
  }
}

export function inspeksiToRiwayatTransaction(row: InspectionOrderDto): RiwayatTransaction {
  return {
    id: `inspeksi-${row.id}`,
    type: 'inspeksi',
    title: row.productName,
    subtitle: `${row.teknisi.name} · ${row.orderCode}`,
    amount: row.price,
    status: mapInspectionStatus(row.status),
    date: row.createdAt,
    href: getUserActivityHref('inspeksi', row.id),
  }
}

export async function fetchUserInspeksiRiwayat(): Promise<InspectionOrderDto[]> {
  const res = await fetch('/api/user/inspeksi', { cache: 'no-store' })
  if (res.status === 401) return []
  const json = await res.json()
  if (!res.ok || !json.success) return []
  return json.data ?? []
}
