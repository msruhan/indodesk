import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { createIndodeskSessionGrant } from '@/lib/indodesk-auth'
import { buildIndodeskConnectLink, buildIndodeskPasswordLink } from '@/lib/indodesk-deeplink'
import { INODESK_UNLOCK_STATUSES } from '@/lib/indodesk-session-policy'

export const dynamic = 'force-dynamic'

/** GET /api/indodesk/session-grant?sessionId=... — grant JWT untuk sesi aktif */
export async function GET(req: Request) {
  const { session, error } = await requireApiRole(['USER', 'TEKNISI'])
  if (error) return error

  const sessionId = new URL(req.url).searchParams.get('sessionId')?.trim()
  if (!sessionId) {
    return apiError('sessionId wajib')
  }

  try {
    const row = await prisma.konsultasiSession.findUnique({ where: { id: sessionId } })
    if (
      !row ||
      !(INODESK_UNLOCK_STATUSES as readonly string[]).includes(row.status) ||
      !row.requiresRemote ||
      !row.remoteId ||
      !row.remoteOtp
    ) {
      return apiError('Sesi remote tidak aktif', 404)
    }

    const isUser = row.userId === session.user.id
    const isTeknisi = row.teknisiId === session.user.id
    if (!isUser && !isTeknisi) {
      return apiError('Akses ditolak', 403)
    }

    const grant = createIndodeskSessionGrant({
      sessionId: row.id,
      userId: row.userId,
      teknisiId: row.teknisiId,
      remoteId: row.remoteId,
      remoteOtp: row.remoteOtp,
    })

    return apiSuccess({
      grant,
      remoteId: row.remoteId,
      remoteOtp: row.remoteOtp,
      connectLink: isTeknisi
        ? buildIndodeskConnectLink(row.remoteId, row.remoteOtp)
        : null,
      passwordLink: isUser ? buildIndodeskPasswordLink(row.remoteOtp) : null,
    })
  } catch (e) {
    console.error('[INODESK_SESSION_GRANT]', e)
    return apiError('Gagal membuat grant sesi', 500)
  }
}
