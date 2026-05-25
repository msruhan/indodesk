import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logCommunicationEvent, logPaymentEvent } from '@/lib/activity-log'
import {
  creditTeknisiForKonsultasi,
  refundUserForKonsultasi,
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
    const existing = await prisma.konsultasiSession.findFirst({
      where: { id, teknisiId: session.user.id },
      include: { user: { select: USER_SELECT } },
    })
    if (!existing) return apiError('Konsultasi tidak ditemukan', 404)

    const now = new Date()
    let data: {
      status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
      startedAt?: Date | null
      endedAt?: Date | null
    }

    switch (parsed.data.action) {
      case 'start':
        if (existing.status !== 'PENDING') {
          return apiError('Hanya konsultasi menunggu yang bisa dimulai')
        }
        data = { status: 'ACTIVE', startedAt: now }
        break
      case 'complete':
        if (existing.status !== 'ACTIVE') {
          return apiError('Hanya konsultasi berjalan yang bisa diselesaikan')
        }
        data = { status: 'COMPLETED', endedAt: now }
        break
      case 'cancel':
        if (existing.status !== 'PENDING') {
          return apiError('Hanya konsultasi menunggu yang bisa dibatalkan')
        }
        data = { status: 'CANCELLED', endedAt: now }
        break
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.konsultasiSession.update({
        where: { id },
        data,
        include: { user: { select: USER_SELECT } },
      })

      if (parsed.data.action === 'complete') {
        const alreadyCredited = await tx.walletLedger.findFirst({
          where: {
            type: 'EARNING',
            referenceId: id,
            wallet: { userId: session.user.id },
          },
        })
        if (!alreadyCredited) {
          await creditTeknisiForKonsultasi(
            tx,
            session.user.id,
            existing.price,
            id,
            `Pendapatan konsultasi: ${existing.service}`,
          )
        }
      }

      if (parsed.data.action === 'cancel') {
        const alreadyRefunded = await tx.walletLedger.findFirst({
          where: {
            type: 'REFUND',
            referenceId: id,
            wallet: { userId: existing.userId },
          },
        })
        if (!alreadyRefunded) {
          await refundUserForKonsultasi(
            tx,
            existing.userId,
            existing.price,
            id,
            `Refund konsultasi dibatalkan: ${existing.service}`,
          )
        }
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
