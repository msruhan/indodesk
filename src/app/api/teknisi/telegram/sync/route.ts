import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { isTelegramEnabled } from '@/lib/telegram'
import { syncTelegramLinkFromUpdates } from '@/lib/telegram/link-sync'

export const dynamic = 'force-dynamic'

const schema = z.object({
  token: z.string().min(8),
})

/**
 * POST /api/teknisi/telegram/sync
 * Poll Telegram getUpdates untuk menyelesaikan linking jika webhook belum menerima /start TOKEN.
 */
export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  if (!isTelegramEnabled()) {
    return apiError('Telegram bot belum dikonfigurasi', 503)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return apiError('Token verifikasi tidak valid')
  }

  try {
    const result = await syncTelegramLinkFromUpdates(session.user.id, parsed.data.token)
    if (result.linked) {
      return apiSuccess({
        synced: true,
        username: result.username ?? null,
      })
    }
    return apiSuccess({
      synced: false,
      message: result.error ?? 'Belum terdeteksi di Telegram. Pastikan Anda membuka link dari dashboard dan menekan Start.',
    })
  } catch (e) {
    console.error('[TELEGRAM_SYNC_ERROR]', e)
    return apiError('Gagal sinkronisasi Telegram', 500)
  }
}
