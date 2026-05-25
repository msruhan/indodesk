import type { UserRemoteDto } from '@/lib/user-remote-serializer'
import { getUserActivityHref } from '@/lib/user-activity-href'
import type { RiwayatTransaction, RiwayatTxStatus } from '@/lib/user-riwayat-orders'

function mapRemoteStatus(status: UserRemoteDto['status']): RiwayatTxStatus {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'waiting':
      return 'pending'
    case 'active':
      return 'in-progress'
    case 'rejected':
      return 'failed'
  }
}

export function remoteToRiwayatTransaction(row: UserRemoteDto): RiwayatTransaction {
  return {
    id: `remote-${row.id}`,
    type: 'remote',
    title: row.description ?? `Remote ${row.sessionCode}`,
    subtitle: `${row.teknisiName} · ${row.remoteId}`,
    amount: 0,
    status: mapRemoteStatus(row.status),
    date: row.createdAt,
    href: getUserActivityHref('remote'),
  }
}

export async function fetchUserRemoteRiwayat(): Promise<UserRemoteDto[]> {
  const res = await fetch('/api/user/remote', { cache: 'no-store' })
  if (res.status === 401) return []
  const json = await res.json()
  if (!res.ok || !json.success) return []
  return json.data ?? []
}
