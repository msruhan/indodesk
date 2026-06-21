import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { buildTelegramDeepLink, isTelegramEnabled, resolveTelegramBotUsername } from '@/lib/telegram'
import { issueTelegramLinkToken } from '@/lib/telegram/link-token'

export const dynamic = 'force-dynamic'

/** POST /api/admin/telegram/account/link */
export async function POST() {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  if (!isTelegramEnabled()) {
    return apiError('Telegram bot belum dikonfigurasi', 503)
  }

  try {
    const token = await issueTelegramLinkToken(session.user.id)
    const botUsername = await resolveTelegramBotUsername()
    if (!botUsername) {
      return apiError('Username bot Telegram tidak ditemukan', 503)
    }

    return apiSuccess({
      token,
      botUsername,
      deepLink: buildTelegramDeepLink(botUsername, token),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
  } catch (e) {
    console.error('[ADMIN_TELEGRAM_LINK_ERROR]', e)
    return apiError('Gagal membuat link token', 500)
  }
}
