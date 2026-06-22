import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { authorizeIndodeskConnection } from '@/lib/indodesk-auth'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  deviceToken: z.string().min(16),
  direction: z.enum(['incoming', 'outgoing']),
  peerId: z.string().min(6).max(32),
  password: z.string().min(4).max(32).optional(),
  grant: z.string().optional(),
})

/** POST /api/indodesk/authorize — validasi koneksi IndoDesk */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  try {
    const result = await authorizeIndodeskConnection(parsed.data)
    if (!result.allowed) {
      return apiSuccess({ allowed: false, reason: result.reason ?? 'Ditolak' })
    }
    return apiSuccess({ allowed: true })
  } catch (e) {
    console.error('[INODESK_AUTHORIZE]', e)
    return apiError('Gagal memvalidasi koneksi', 500)
  }
}
