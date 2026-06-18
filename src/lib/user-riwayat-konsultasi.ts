import type { UserKonsultasiDto } from '@/lib/user-konsultasi-serializer'
import { getUserActivityHref } from '@/lib/user-activity-href'
import type { RiwayatTransaction, RiwayatTxStatus } from '@/lib/user-riwayat-orders'

function mapKonsultasiStatus(status: UserKonsultasiDto['status']): RiwayatTxStatus {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'pending':
    case 'awaiting_payment':
      return 'pending'
    case 'active':
      return 'in-progress'
    case 'cancelled':
      return 'failed'
  }
}

export function konsultasiToRiwayatTransaction(row: UserKonsultasiDto): RiwayatTransaction {
  return {
    id: `konsultasi-${row.id}`,
    type: 'konsultasi',
    title: row.service,
    subtitle: row.teknisiName,
    amount: row.amount,
    status: mapKonsultasiStatus(row.status),
    date: row.createdAt,
    href: getUserActivityHref('konsultasi'),
  }
}

export async function fetchUserKonsultasiRiwayat(): Promise<UserKonsultasiDto[]> {
  const res = await fetch('/api/user/konsultasi', { cache: 'no-store' })
  if (res.status === 401) return []
  const json = await res.json()
  if (!res.ok || !json.success) return []
  return json.data ?? []
}
