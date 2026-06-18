import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logCommunicationEvent, logPaymentEvent } from '@/lib/activity-log'
import {
  finalizeKonsultasiPaymentToTeknisi,
  refundKonsultasiPayment,
} from '@/lib/konsultasi-wallet'
import { serializeTeknisiKonsultasi, type UserParty } from '@/lib/teknisi-layanan-serializer'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  action: z.enum(['start', 'complete', 'cancel']),
})

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} satisfies Record<keyof UserParty, true>

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Aksi tidak valid')
  }

  try {
    const existing = await prisma.konsultasiSession.findUnique({
      where: { id },
      include: { user: { select: USER_SELECT } },
    })
    if (!existing) return apiError('Konsultasi tidak ditemukan', 404)
    if (existing.teknisiId !== session.user.id) {
      return apiError('Akses ditolak', 403)
    }

    const now = new Date()
    let data: {
      status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
      startedAt?: Date | null
      endedAt?: Date | null
      remoteOtp?: null
      paymentStatus?: 'CAPTURED' | 'RELEASED'
    }

    switch (parsed.data.action) {
      case 'start':
        if (existing.status !== 'PENDING') {
          return apiError('Hanya konsultasi menunggu yang bisa dimulai')
        }
        if (existing.paymentStatus !== 'SECURED') {
          return apiError('Pembayaran belum dikonfirmasi')
        }
        data = { status: 'ACTIVE', startedAt: now }
        break
      case 'complete':
        if (existing.status !== 'ACTIVE') {
          return apiError('Hanya konsultasi berjalan yang bisa diselesaikan')
        }
        data = { status: 'COMPLETED', endedAt: now, remoteOtp: null, paymentStatus: 'CAPTURED' }
        break
      case 'cancel':
        if (existing.status !== 'PENDING' && existing.status !== 'ACTIVE') {
          return apiError('Konsultasi tidak dapat dibatalkan pada status ini')
        }
        data = {
          status: 'CANCELLED',
          endedAt: now,
          remoteOtp: null,
          ...(existing.status === 'PENDING' ? { paymentStatus: 'RELEASED' as const } : {}),
        }
        break
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.konsultasiSession.update({
        where: { id },
        data,
        include: { user: { select: USER_SELECT } },
      })

      if (parsed.data.action === 'complete') {
        await finalizeKonsultasiPaymentToTeknisi(
          tx,
          session.user.id,
          existing.userId,
          existing.price,
          id,
          existing.service,
          existing.paymentMethod,
        )
      }

      if (parsed.data.action === 'cancel' && existing.status === 'PENDING') {
        await refundKonsultasiPayment(
          tx,
          existing.userId,
          existing.price,
          id,
          existing.service,
          existing.paymentMethod,
          existing.paymentStatus,
        )
      }

      return row
    })

    const actor = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'TEKNISI' as const,
    }

    const userLabel = existing.user.name ?? existing.user.email ?? 'User'
    if (parsed.data.action === 'start') {
      void logCommunicationEvent({
        action: 'konsultasi.started',
        severity: 'INFO',
        summary: `Konsultasi dimulai: ${existing.service} — ${userLabel}`,
        actor,
        target: { type: 'konsultasi', id, label: existing.service },
      })
    } else if (parsed.data.action === 'complete') {
      void logPaymentEvent({
        action: 'konsultasi.earning',
        severity: 'SUCCESS',
        summary: `Pendapatan konsultasi: ${existing.service} — ${userLabel}`,
        actor,
        target: { type: 'konsultasi', id, label: existing.service },
      })
      void logCommunicationEvent({
        action: 'konsultasi.completed',
        severity: 'SUCCESS',
        summary: `Konsultasi selesai: ${existing.service} — ${userLabel}`,
        actor,
        target: { type: 'konsultasi', id, label: existing.service },
      })
      const { syncTeknisiCompletedSessions } = await import('@/lib/teknisi-stats-server')
      await syncTeknisiCompletedSessions(session.user.id)
    } else {
      void logCommunicationEvent({
        action: 'konsultasi.cancelled',
        severity: 'WARNING',
        summary: `Konsultasi dibatalkan: ${existing.service} — ${userLabel}`,
        actor,
        target: { type: 'konsultasi', id, label: existing.service },
      })
    }

    return apiSuccess(serializeTeknisiKonsultasi(updated))
  } catch (e) {
    console.error('[TEKNISI_KONSULTASI_PATCH]', e)
    return apiError('Gagal memperbarui konsultasi', 500)
  }
}
