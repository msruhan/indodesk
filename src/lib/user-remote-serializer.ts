import type { RemoteSession, User } from '@prisma/client'
import {
  mapRemoteUiStatus,
  remoteStatusLabel,
  type TeknisiRemoteUiStatus,
} from '@/lib/teknisi-layanan-serializer'
import { formatNotificationTimeLabel } from '@/lib/notification-display'

export type TeknisiParty = Pick<User, 'id' | 'name' | 'email' | 'image'>

export type UserRemoteDto = {
  id: string
  sessionCode: string
  teknisiId: string
  teknisiName: string
  teknisiImage: string | null
  remoteId: string
  description: string | null
  platform: string | null
  status: TeknisiRemoteUiStatus
  statusLabel: string
  createdAt: string
  dateLabel: string
  canCancel: boolean
}

export function serializeUserRemote(
  session: RemoteSession & { teknisi: TeknisiParty },
): UserRemoteDto {
  const status = mapRemoteUiStatus(session.status)
  return {
    id: session.id,
    sessionCode: `RMT-${session.id.slice(-8).toUpperCase()}`,
    teknisiId: session.teknisi.id,
    teknisiName: session.teknisi.name ?? 'Teknisi',
    teknisiImage: session.teknisi.image,
    remoteId: session.remoteId,
    description: session.description,
    platform: session.platform,
    status,
    statusLabel: remoteStatusLabel(status),
    createdAt: session.createdAt.toISOString(),
    dateLabel: formatNotificationTimeLabel(session.updatedAt),
    canCancel: session.status === 'WAITING',
  }
}
