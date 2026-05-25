import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/teknisi/telegram/unlink
 * Unlink Telegram from current teknisi account
 */
export async function DELETE() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    await prisma.teknisiProfile.update({
      where: { userId: session.user.id },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkedAt: null,
      },
    })

    return apiSuccess({ message: 'Telegram berhasil diputus' })
  } catch (e) {
    console.error('[TELEGRAM_UNLINK_ERROR]', e)
    return apiError('Gagal memutus koneksi Telegram', 500)
  }
}
