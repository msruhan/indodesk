import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { consumeTelegramLinkToken } from '@/lib/telegram/link-token'

export const dynamic = 'force-dynamic'

/**
 * POST /api/teknisi/telegram/verify-manual
 * Manual verification for development (bypass webhook).
 * Body: { token: string, chatId: string, username?: string }
 */
export async function POST(request: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  if (process.env.NODE_ENV === 'production') {
    return apiError('Manual verify tidak tersedia di production', 403)
  }

  try {
    const body = await request.json()
    const { token, chatId, username } = body

    if (!token || !chatId) {
      return apiError('Token dan Chat ID diperlukan', 400)
    }

    const userId = await consumeTelegramLinkToken(String(token))
    if (!userId) {
      return apiError('Token tidak valid atau sudah kedaluwarsa', 400)
    }

    if (userId !== session.user.id) {
      return apiError('Token tidak sesuai dengan user yang login', 403)
    }

    await prisma.teknisiProfile.update({
      where: { userId },
      data: {
        telegramChatId: String(chatId),
        telegramUsername: username || null,
        telegramLinkedAt: new Date(),
      },
    })

    await prisma.user.update({
      where: { id: userId },
      data: { telegramLinkedAt: new Date() },
    })

    return apiSuccess({
      message: 'Telegram berhasil terhubung!',
      chatId,
      username,
    })
  } catch (e) {
    console.error('[TELEGRAM_VERIFY_MANUAL_ERROR]', e)
    return apiError('Gagal verifikasi Telegram', 500)
  }
}
