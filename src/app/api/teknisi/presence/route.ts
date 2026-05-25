import { z } from 'zod'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { setTeknisiPresence } from '@/lib/teknisi-presence'

const bodySchema = z.object({
  online: z.boolean(),
})

/** POST /api/teknisi/presence — teknisi set online/offline (sesi aktif). */
export async function POST(req: Request) {
  const auth = await requireApiRole(['TEKNISI'])
  if (auth.error) return auth.error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid', 400)
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError('online (boolean) wajib diisi', 400)
  }

  try {
    await setTeknisiPresence(auth.session.user.id, parsed.data.online)
    return apiSuccess({ online: parsed.data.online })
  } catch (e) {
    console.error('[TEKNISI_PRESENCE]', e)
    return apiError('Gagal memperbarui status online', 500)
  }
}
