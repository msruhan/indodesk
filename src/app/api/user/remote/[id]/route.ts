import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { logCommunicationEvent } from '@/lib/activity-log'
import { serializeUserRemote, type TeknisiParty } from '@/lib/user-remote-serializer'

export const dynamic = 'force-dynamic'

const TEKNISI_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} satisfies Record<keyof TeknisiParty, true>

const patchSchema = z.object({
  action: z.enum(['cancel']),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiAuth()
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
      where: { id, userId: session.user.id },
      include: { teknisi: { select: TEKNISI_SELECT } },
    })
    if (!existing) return apiError('Sesi remote tidak ditemukan', 404)

    if (existing.status !== 'WAITING') {
      return apiError('Hanya request menunggu yang bisa dibatalkan')
    }

    const updated = await prisma.remoteSession.update({
      where: { id },
      data: {
        status: 'REJECTED',
        remoteOtp: null,
        completedAt: new Date(),
      },
      include: { teknisi: { select: TEKNISI_SELECT } },
    })

    void logCommunicationEvent({
      action: 'remote.cancelled',
      severity: 'INFO',
      summary: `Remote dibatalkan user: ${existing.remoteId}`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      target: { type: 'remote', id, label: existing.remoteId },
    })

    return apiSuccess(serializeUserRemote(updated))
  } catch (e) {
    console.error('[USER_REMOTE_PATCH]', e)
    return apiError('Gagal membatalkan remote', 500)
  }
}
