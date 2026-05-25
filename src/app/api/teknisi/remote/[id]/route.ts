import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logCommunicationEvent } from '@/lib/activity-log'
import { serializeTeknisiRemote, type UserParty } from '@/lib/teknisi-layanan-serializer'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  action: z.enum(['accept', 'reject', 'complete']),
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
    const existing = await prisma.remoteSession.findFirst({
      where: { id, teknisiId: session.user.id },
      include: { user: { select: USER_SELECT } },
    })
    if (!existing) return apiError('Request remote tidak ditemukan', 404)

    const now = new Date()
    let data: {
      status: 'WAITING' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED'
      acceptedAt?: Date | null
      completedAt?: Date | null
      remoteOtp?: string | null
    }

    switch (parsed.data.action) {
      case 'accept':
        if (existing.status !== 'WAITING') {
          return apiError('Hanya request menunggu yang bisa diterima')
        }
        data = { status: 'IN_PROGRESS', acceptedAt: now }
        break
      case 'reject':
        if (existing.status !== 'WAITING') {
          return apiError('Hanya request menunggu yang bisa ditolak')
        }
        data = { status: 'REJECTED', completedAt: now, remoteOtp: null }
        break
      case 'complete':
        if (existing.status !== 'IN_PROGRESS' && existing.status !== 'ACCEPTED') {
          return apiError('Hanya sesi aktif yang bisa diselesaikan')
        }
        data = { status: 'COMPLETED', completedAt: now, remoteOtp: null }
        break
    }

    const updated = await prisma.remoteSession.update({
      where: { id },
      data,
      include: { user: { select: USER_SELECT } },
    })

    const actor = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'TEKNISI' as const,
    }
    const userLabel = existing.user.name ?? existing.user.email ?? 'User'

    if (parsed.data.action === 'accept') {
      void logCommunicationEvent({
        action: 'remote.accepted',
        severity: 'INFO',
        summary: `Remote diterima: ${existing.remoteId} — ${userLabel}`,
        actor,
        target: { type: 'remote', id, label: existing.remoteId },
      })
    } else if (parsed.data.action === 'reject') {
      void logCommunicationEvent({
        action: 'remote.rejected',
        severity: 'WARNING',
        summary: `Remote ditolak: ${existing.remoteId} — ${userLabel}`,
        actor,
        target: { type: 'remote', id, label: existing.remoteId },
      })
    } else {
      void logCommunicationEvent({
        action: 'remote.completed',
        severity: 'SUCCESS',
        summary: `Remote selesai: ${existing.remoteId} — ${userLabel}`,
        actor,
        target: { type: 'remote', id, label: existing.remoteId },
      })
      const { syncTeknisiCompletedSessions } = await import('@/lib/teknisi-stats-server')
      await syncTeknisiCompletedSessions(session.user.id)
    }

    return apiSuccess(serializeTeknisiRemote(updated))
  } catch (e) {
    console.error('[TEKNISI_REMOTE_PATCH]', e)
    return apiError('Gagal memperbarui request remote', 500)
  }
}
