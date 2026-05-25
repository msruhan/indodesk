import type { KonsultasiSession, User } from '@prisma/client'
import {
  konsultasiStatusLabel,
  mapKonsultasiUiStatus,
  type TeknisiKonsultasiStatus,
} from '@/lib/teknisi-layanan-serializer'

export type TeknisiParty = Pick<User, 'id' | 'name' | 'email' | 'image'>

export type UserKonsultasiDto = {
  id: string
  orderId: string
  teknisiId: string
  teknisiName: string
  teknisiImage: string | null
  service: string
  amount: number
  status: TeknisiKonsultasiStatus
  statusLabel: string
  rating: number | null
  review: string | null
  createdAt: string
  startedAt: string | null
  endedAt: string | null
  canCancel: boolean
  canRate: boolean
  chatHref: string
}

export function serializeUserKonsultasi(
  session: KonsultasiSession & { teknisi: TeknisiParty },
): UserKonsultasiDto {
  const status = mapKonsultasiUiStatus(session.status)
  return {
    id: session.id,
    orderId: `KON-${session.id.slice(-8).toUpperCase()}`,
    teknisiId: session.teknisi.id,
    teknisiName: session.teknisi.name ?? 'Teknisi',
    teknisiImage: session.teknisi.image,
    service: session.service,
    amount: Number(session.price),
    status,
    statusLabel: konsultasiStatusLabel(status),
    rating: session.rating,
    review: session.review,
    createdAt: session.createdAt.toISOString(),
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    canCancel: session.status === 'PENDING',
    canRate: session.status === 'COMPLETED' && session.rating == null,
    chatHref: `/user/chat?peer=${session.teknisi.id}`,
  }
}
