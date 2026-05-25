import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { parseTelegramLinkToken } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

/**
 * POST /api/teknisi/telegram/verify-manual
 * Manual verification for development (bypass webhook)
 * Body: { token: string, chatId: string, username?: string }
 */
export async function POST(request: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const body = await request.json()
    const { token, chatId, username } = body

    if (!token || !chatId) {
      return apiError('Token dan Chat ID diperlukan', 400)
    }

    // Parse token to get userId
    const userId = parseTelegramLinkToken(token)
    if (!userId) {
      return apiError('Token tidak valid', 400)
    }

    // Verify token belongs to current user
    if (userId !== session.user.id) {
      return apiError('Token tidak sesuai dengan user yang login', 403)
    }

    // Check if token exists and not expired
    const verification = await prisma.telegramVerification.findFirst({
      where: {
        userId,
        code: token,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!verification) {
      return apiError('Token tidak ditemukan atau sudah expired', 400)
    }

    // Update teknisi profile
    await prisma.teknisiProfile.update({
      where: { userId },
      data: {
        telegramChatId: chatId,
        telegramUsername: username || null,
        telegramLinkedAt: new Date(),
      },
    })

    // Delete used token
    await prisma.telegramVerification.delete({
      where: { id: verification.id },
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
