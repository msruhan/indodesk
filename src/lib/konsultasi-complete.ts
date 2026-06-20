import type { KonsultasiSession, Prisma } from '@prisma/client'
import { logCommunicationEvent, logPaymentEvent } from '@/lib/activity-log'
import { finalizeKonsultasiPaymentToTeknisi } from '@/lib/konsultasi-wallet'

type Tx = Prisma.TransactionClient
export type KonsultasiCompletionSource = 'user' | 'auto_timeout'

export class KonsultasiCompletionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'KonsultasiCompletionError'
  }
}

export async function completeKonsultasiSession(
  tx: Tx,
  existing: KonsultasiSession,
  opts: { source: KonsultasiCompletionSource; actorUserId?: string },
): Promise<KonsultasiSession> {
  if (existing.status === 'COMPLETED') return existing
  if (existing.status !== 'AWAITING_CONFIRMATION') {
    throw new KonsultasiCompletionError('INVALID_STATUS')
  }

  const now = new Date()
  const row = await tx.konsultasiSession.update({
    where: { id: existing.id },
    data: {
      status: 'COMPLETED',
      endedAt: now,
      remoteOtp: null,
      paymentStatus: 'CAPTURED',
    },
  })

  await finalizeKonsultasiPaymentToTeknisi(
    tx,
    existing.teknisiId,
    existing.userId,
    existing.teknisiEarning,
    existing.id,
    existing.service,
    existing.paymentMethod,
  )

  void opts
  return row
}

export async function finalizeKonsultasiCompletionSideEffects(
  session: KonsultasiSession,
  opts: {
    source: KonsultasiCompletionSource
    actorName?: string | null
    actorEmail?: string | null
    userName?: string | null
  },
) {
  const { syncTeknisiCompletedSessions } = await import('@/lib/teknisi-stats-server')
  await syncTeknisiCompletedSessions(session.teknisiId)

  const userLabel = opts.userName ?? 'User'
  const actor =
    opts.source === 'user'
      ? {
          id: session.userId,
          name: opts.actorName ?? 'User',
          email: opts.actorEmail ?? null,
          role: 'USER' as const,
        }
      : {
          id: 'system',
          name: 'Sistem',
          email: null,
          role: 'ADMIN' as const,
        }

  void logPaymentEvent({
    action: 'konsultasi.earning',
    severity: 'SUCCESS',
    summary: `Pendapatan konsultasi: ${session.service} — ${userLabel}`,
    actor,
    target: { type: 'konsultasi', id: session.id, label: session.service },
  })

  const completedSummary =
    opts.source === 'auto_timeout'
      ? `Konsultasi otomatis selesai (timeout): ${session.service} — ${userLabel}`
      : `Konsultasi selesai: ${session.service} — ${userLabel}`

  void logCommunicationEvent({
    action: 'konsultasi.completed',
    severity: 'SUCCESS',
    summary: completedSummary,
    actor,
    target: { type: 'konsultasi', id: session.id, label: session.service },
  })
}
