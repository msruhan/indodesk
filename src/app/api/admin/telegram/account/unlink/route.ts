import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { unlinkTelegramAccount } from '@/lib/telegram/link-account'

export const dynamic = 'force-dynamic'

/** DELETE /api/admin/telegram/account/unlink */
export async function DELETE() {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    await unlinkTelegramAccount(session.user.id)
    return apiSuccess({ message: 'Telegram berhasil diputus' })
  } catch (e) {
    console.error('[ADMIN_TELEGRAM_UNLINK_ERROR]', e)
    return apiError('Gagal memutus koneksi Telegram', 500)
  }
}
