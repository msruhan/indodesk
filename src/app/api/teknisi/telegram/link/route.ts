import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { generateTelegramLinkToken, isTelegramEnabled } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

/**
 * POST /api/teknisi/telegram/link
 * Generate a link token for Telegram verification
 */
export async function POST() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  if (!isTelegramEnabled()) {
    return apiError('Telegram bot belum dikonfigurasi', 503)
  }

  try {
    const token = generateTelegramLinkToken(session.user.id)
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'YourBot'

    return apiSuccess({
      token,
      botUsername,
      deepLink: `https://t.me/${botUsername}?start=${token}`,
    })
  } catch (e) {
    console.error('[TELEGRAM_LINK_ERROR]', e)
    return apiError('Gagal membuat link token', 500)
  }
}
