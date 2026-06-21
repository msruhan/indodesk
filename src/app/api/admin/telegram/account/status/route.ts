import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { getTelegramLinkSnapshot } from '@/lib/telegram/link-account'

export const dynamic = 'force-dynamic'

/** GET /api/admin/telegram/account/status */
export async function GET() {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const snapshot = await getTelegramLinkSnapshot(session.user.id)
    if (!snapshot) {
      return apiError('Akun admin tidak ditemukan', 404)
    }

    return apiSuccess({
      isLinked: snapshot.isLinked,
      username: snapshot.username,
      linkedAt: snapshot.linkedAt?.toISOString() ?? null,
    })
  } catch (e) {
    console.error('[ADMIN_TELEGRAM_STATUS_ERROR]', e)
    return apiError('Gagal mengambil status Telegram', 500)
  }
}
