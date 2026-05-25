import type { KonsultasiSession, RemoteSession, User } from '@prisma/client'
import { formatMonitoringRelativeTime } from '@/lib/admin-monitoring'

export type UserParty = Pick<User, 'id' | 'name' | 'email' | 'image'>

export type TeknisiKonsultasiStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export type TeknisiKonsultasiDto = {
  id: string
  orderId: string
  userId: string
  userName: string
  userEmail: string | null
  userImage: string | null
  service: string
  amount: number
  status: TeknisiKonsultasiStatus
  statusLabel: string
  rating: number | null
  date: string
  createdAt: string
}

export type TeknisiRemoteUiStatus = 'waiting' | 'active' | 'rejected' | 'completed'

export type TeknisiRemoteDto = {
  id: string
  userId: string
  userName: string
  userImage: string | null
  remoteId: string
  remoteOtp: string | null
  description: string
  platform: string
  requestedAt: string
  status: TeknisiRemoteUiStatus
  statusLabel: string
  createdAt: string
}

export type TeknisiKonsultasiStats = {
  total: number
  pending: number
  active: number
  completed: number
}

export type TeknisiRemoteStats = {
  total: number
  waiting: number
  active: number
  completed: number
  rejected: number
}

export function mapKonsultasiUiStatus(dbStatus: string): TeknisiKonsultasiStatus {
  switch (dbStatus) {
    case 'PENDING':
      return 'pending'
    case 'ACTIVE':
      return 'active'
    case 'COMPLETED':
      return 'completed'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'pending'
  }
}

export function konsultasiStatusLabel(status: TeknisiKonsultasiStatus): string {
  switch (status) {
    case 'pending':
      return 'Menunggu'
    case 'active':
      return 'Berjalan'
    case 'completed':
      return 'Selesai'
    case 'cancelled':
      return 'Dibatalkan'
  }
}

export function mapRemoteUiStatus(dbStatus: string): TeknisiRemoteUiStatus {
  switch (dbStatus) {
    case 'WAITING':
      return 'waiting'
    case 'ACCEPTED':
    case 'IN_PROGRESS':
      return 'active'
    case 'REJECTED':
      return 'rejected'
    case 'COMPLETED':
      return 'completed'
    default:
      return 'waiting'
  }
}

export function remoteStatusLabel(status: TeknisiRemoteUiStatus): string {
  switch (status) {
    case 'waiting':
      return 'Menunggu'
    case 'active':
      return 'Aktif'
    case 'rejected':
      return 'Ditolak'
    case 'completed':
      return 'Selesai'
  }
}

export function serializeTeknisiKonsultasi(
  session: KonsultasiSession & { user: UserParty },
): TeknisiKonsultasiDto {
  const status = mapKonsultasiUiStatus(session.status)
  return {
    id: session.id,
    orderId: `KON-${session.id.slice(-8).toUpperCase()}`,
    userId: session.user.id,
    userName: session.user.name ?? 'User',
    userEmail: session.user.email,
    userImage: session.user.image,
    service: session.service,
    amount: Number(session.price),
    status,
    statusLabel: konsultasiStatusLabel(status),
    rating: session.rating,
    date: formatMonitoringRelativeTime(session.updatedAt),
    createdAt: session.createdAt.toISOString(),
  }
}

export function serializeTeknisiRemote(
  session: RemoteSession & { user: UserParty },
): TeknisiRemoteDto {
  const status = mapRemoteUiStatus(session.status)
  const showOtp = status === 'waiting' || status === 'active'
  return {
    id: session.id,
    userId: session.user.id,
    userName: session.user.name ?? 'User',
    userImage: session.user.image,
    remoteId: session.remoteId,
    remoteOtp: showOtp ? session.remoteOtp : null,
    description: session.description?.trim() || '—',
    platform: session.platform?.trim() || '—',
    requestedAt: formatMonitoringRelativeTime(session.createdAt),
    status,
    statusLabel: remoteStatusLabel(status),
    createdAt: session.createdAt.toISOString(),
  }
}

export function buildKonsultasiStats(items: TeknisiKonsultasiDto[]): TeknisiKonsultasiStats {
  return {
    total: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    active: items.filter((i) => i.status === 'active').length,
    completed: items.filter((i) => i.status === 'completed').length,
  }
}

export function buildRemoteStats(items: TeknisiRemoteDto[]): TeknisiRemoteStats {
  return {
    total: items.length,
    waiting: items.filter((i) => i.status === 'waiting').length,
    active: items.filter((i) => i.status === 'active').length,
    completed: items.filter((i) => i.status === 'completed').length,
    rejected: items.filter((i) => i.status === 'rejected').length,
  }
}
