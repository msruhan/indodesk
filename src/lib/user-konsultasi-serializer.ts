import type { KonsultasiSession, User } from '@prisma/client'
import { isIndodeskRemoteOtpVisible } from '@/lib/indodesk-session-policy'
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
  paymentStatus: string
  device: string | null
  clientOs: string | null
  requiresRemote: boolean
  remoteId: string | null
  remoteOtp: string | null
  note: string | null
  rating: number | null
  review: string | null
  createdAt: string
  startedAt: string | null
  endedAt: string | null
  canCancel: boolean
  canRate: boolean
  canConfirmPayment: boolean
  canConfirmComplete: boolean
  confirmDeadlineAt: string | null
  payHref: string | null
  needsChannelPayment: boolean
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
    paymentStatus: session.paymentStatus,
    device: session.device,
    clientOs: session.clientOs,
    requiresRemote: session.requiresRemote,
    remoteId: session.remoteId,
    remoteOtp: isIndodeskRemoteOtpVisible(session.status, session.requiresRemote)
      ? session.remoteOtp
      : null,
    note: session.note,
    rating: session.rating,
    review: session.review,
    createdAt: session.createdAt.toISOString(),
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    canCancel: session.status === 'PENDING' || session.status === 'AWAITING_PAYMENT',
    canRate: session.status === 'COMPLETED' && session.rating == null,
    canConfirmPayment: session.status === 'AWAITING_PAYMENT' && session.pgProvider === 'stub',
    canConfirmComplete: session.status === 'AWAITING_CONFIRMATION',
    confirmDeadlineAt: session.confirmDeadlineAt?.toISOString() ?? null,
    payHref:
      session.status === 'AWAITING_PAYMENT' && session.pgExternalRef
        ? `/payments/${session.pgExternalRef}`
        : null,
    needsChannelPayment:
      session.status === 'AWAITING_PAYMENT' &&
      session.paymentMethod === 'PAYMENT_GATEWAY' &&
      !session.pgExternalRef,
    chatHref: `/user/chat?peer=${session.teknisi.id}`,
  }
}
