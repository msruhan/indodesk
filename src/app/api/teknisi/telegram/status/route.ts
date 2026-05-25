import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/teknisi/telegram/status
 * Check if Telegram is linked for current teknisi
 */
export async function GET() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const profile = await prisma.teknisiProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        telegramChatId: true,
        telegramUsername: true,
        telegramLinkedAt: true,
      },
    })

    if (!profile) {
      return apiError('Profil teknisi tidak ditemukan', 404)
    }

    const isLinked = Boolean(profile.telegramChatId)

    return apiSuccess({
      isLinked,
      username: profile.telegramUsername,
      linkedAt: profile.telegramLinkedAt?.toISOString(),
    })
  } catch (e) {
    console.error('[TELEGRAM_STATUS_ERROR]', e)
    return apiError('Gagal mengambil status Telegram', 500)
  }
}
