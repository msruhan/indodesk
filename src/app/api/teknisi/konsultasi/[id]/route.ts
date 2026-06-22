import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logCommunicationEvent } from '@/lib/activity-log'
import { computeConfirmDeadline } from '@/lib/konsultasi-completion'
import { generateIndodeskSessionOtp } from '@/lib/indodesk-otp'
import { refundKonsultasiPayment } from '@/lib/konsultasi-wallet'
import { serializeTeknisiKonsultasi, type UserParty } from '@/lib/teknisi-layanan-serializer'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  action: z.enum(['start', 'mark-done', 'cancel']),
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
      status:
        | 'PENDING'
        | 'ACTIVE'
        | 'AWAITING_CONFIRMATION'
        | 'COMPLETED'
        | 'CANCELLED'
      startedAt?: Date | null
      endedAt?: Date | null
      remoteOtp?: string | null
      paymentStatus?: 'CAPTURED' | 'RELEASED'
      teknisiMarkedDoneAt?: Date | null
      confirmDeadlineAt?: Date | null
    }

    switch (parsed.data.action) {
      case 'start':
        if (existing.status !== 'PENDING') {
          return apiError('Hanya konsultasi menunggu yang bisa dimulai')
        }
        if (existing.paymentStatus !== 'SECURED') {
          return apiError('Pembayaran belum dikonfirmasi')
        }
        if (existing.requiresRemote && !existing.remoteId?.trim()) {
          return apiError('IndoDesk ID belum tersedia untuk sesi remote ini')
        }
        data = {
          status: 'ACTIVE',
          startedAt: now,
          ...(existing.requiresRemote
            ? { remoteOtp: generateIndodeskSessionOtp() }
            : {}),
        }
        break
      case 'mark-done':
        if (existing.status !== 'ACTIVE') {
          return apiError('Hanya konsultasi berjalan yang bisa ditandai selesai')
        }
        if (existing.paymentStatus !== 'SECURED') {
          return apiError('Pembayaran belum dikonfirmasi')
        }
        data = {
          status: 'AWAITING_CONFIRMATION',
          remoteOtp: null,
          teknisiMarkedDoneAt: now,
          confirmDeadlineAt: computeConfirmDeadline(now),
        }
        break
      case 'cancel':
        if (existing.status !== 'PENDING' && existing.status !== 'ACTIVE') {
          return apiError('Konsultasi tidak dapat dibatalkan pada status ini')
        }
        data = {
          status: 'CANCELLED',
          endedAt: now,
          remoteOtp: null,
          teknisiMarkedDoneAt: null,
          confirmDeadlineAt: null,
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
    } else if (parsed.data.action === 'mark-done') {
      void logCommunicationEvent({
        action: 'konsultasi.marked_done',
        severity: 'INFO',
        summary: `Teknisi menandai layanan selesai: ${existing.service} — ${userLabel}`,
        actor,
        target: { type: 'konsultasi', id, label: existing.service },
      })
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
