import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logCommunicationEvent } from '@/lib/activity-log'
import { secureKonsultasiPaymentByRef } from '@/lib/konsultasi-payment'
import { refundKonsultasiPayment } from '@/lib/konsultasi-wallet'
import { walletTransaction } from '@/lib/wallet/transaction'
import { serializeUserKonsultasi } from '@/lib/user-konsultasi-serializer'

export const dynamic = 'force-dynamic'

const TEKNISI_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const

const patchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('cancel'),
  }),
  z.object({
    action: z.literal('rate'),
    rating: z.number().int().min(1).max(5),
    review: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal('confirm-payment'),
    pgExternalRef: z.string().min(1).optional(),
  }),
])

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['USER'])
  if (error) return error

  const { id } = await params

  try {
    const row = await prisma.konsultasiSession.findFirst({
      where: { id, userId: session.user.id },
      include: { teknisi: { select: TEKNISI_SELECT } },
    })
    if (!row) return apiError('Konsultasi tidak ditemukan', 404)
    return apiSuccess(serializeUserKonsultasi(row))
  } catch (e) {
    console.error('[USER_KONSULTASI_DETAIL_GET]', e)
    return apiError('Gagal memuat detail konsultasi', 500)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['USER'])
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
    const existing = await prisma.konsultasiSession.findFirst({
      where: { id, userId: session.user.id },
      include: { teknisi: { select: TEKNISI_SELECT } },
    })
    if (!existing) return apiError('Konsultasi tidak ditemukan', 404)

    const actor = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'USER' as const,
    }
    const teknisiLabel = existing.teknisi.name ?? 'Teknisi'

    if (parsed.data.action === 'confirm-payment') {
      const ref = parsed.data.pgExternalRef ?? existing.pgExternalRef
      if (!ref) return apiError('Referensi pembayaran tidak ditemukan')

      const result = await secureKonsultasiPaymentByRef(ref, Number(existing.price))
      if (!result.ok) return apiError(result.error)

      const updated = await prisma.konsultasiSession.findUniqueOrThrow({
        where: { id },
        include: { teknisi: { select: TEKNISI_SELECT } },
      })

      void logCommunicationEvent({
        action: 'konsultasi.created',
        severity: 'INFO',
        summary: `Konsultasi dibayar: ${existing.service} — ${teknisiLabel}`,
        actor,
        target: { type: 'konsultasi', id, label: existing.service },
      })

      return apiSuccess(serializeUserKonsultasi(updated))
    }

    if (parsed.data.action === 'cancel') {
      if (existing.status === 'ACTIVE') {
        return apiError('Konsultasi yang sudah berjalan tidak dapat dibatalkan oleh user')
      }
      if (
        existing.status !== 'PENDING' &&
        existing.status !== 'AWAITING_PAYMENT'
      ) {
        return apiError('Konsultasi tidak dapat dibatalkan pada status ini')
      }

      const updated = await walletTransaction(async (tx) => {
        const row = await tx.konsultasiSession.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            endedAt: new Date(),
            remoteOtp: null,
            paymentStatus:
              existing.paymentStatus === 'UNPAID' ? 'RELEASED' : existing.paymentStatus,
          },
          include: { teknisi: { select: TEKNISI_SELECT } },
        })

        if (existing.status !== 'AWAITING_PAYMENT') {
          await refundKonsultasiPayment(
            tx,
            session.user.id,
            existing.price,
            id,
            existing.service,
            existing.paymentMethod,
            existing.paymentStatus,
          )
        }

        return row
      })

      void logCommunicationEvent({
        action: 'konsultasi.cancelled',
        severity: 'WARNING',
        summary: `User membatalkan konsultasi: ${existing.service} — ${teknisiLabel}`,
        actor,
        target: { type: 'konsultasi', id, label: existing.service },
      })

      return apiSuccess(serializeUserKonsultasi(updated))
    }

    if (existing.status !== 'COMPLETED') {
      return apiError('Rating hanya untuk konsultasi yang sudah selesai')
    }
    if (existing.rating != null) {
      return apiError('Konsultasi ini sudah diberi rating')
    }

    const updated = await prisma.konsultasiSession.update({
      where: { id },
      data: {
        rating: parsed.data.rating,
        review: parsed.data.review?.trim() || null,
      },
      include: { teknisi: { select: TEKNISI_SELECT } },
    })

    void logCommunicationEvent({
      action: 'konsultasi.rated',
      severity: 'INFO',
      summary: `Rating ${parsed.data.rating} untuk ${teknisiLabel}`,
      actor,
      target: { type: 'konsultasi', id, label: existing.service },
    })

    return apiSuccess(serializeUserKonsultasi(updated))
  } catch (e) {
    console.error('[USER_KONSULTASI_PATCH]', e)
    return apiError('Gagal memperbarui konsultasi', 500)
  }
}
