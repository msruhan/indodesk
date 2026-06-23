import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { createIndodeskSessionGrant } from '@/lib/indodesk-auth'
import { requireIndodeskDevice } from '@/lib/indodesk-device-auth'
import { checkIndodeskUnlockRateLimit } from '@/lib/indodesk-unlock-rate-limit'
import { findUnlockEligibleSessionForDevice } from '@/lib/indodesk-session'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  otp: z.string().min(4).max(32),
})

/** POST /api/indodesk/session/unlock — validasi OTP sesi & keluarkan grant */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const { device, token, error } = await requireIndodeskDevice(req, body as Record<string, unknown>)
  if (error || !device || !token) {
    return apiError(error ?? 'Perangkat tidak valid', 401)
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const rateLimited = checkIndodeskUnlockRateLimit(token.slice(0, 16))
  if (rateLimited) {
    return apiError(rateLimited.message, 429, {
      code: 'RATE_LIMITED',
      retryAfterMinutes: rateLimited.retryAfterMinutes,
    })
  }

  try {
    const session = await findUnlockEligibleSessionForDevice(device)
    if (!session?.remoteId || !session.remoteOtp) {
      return apiError('Tidak ada sesi konsultasi remote yang aktif', 403)
    }
    if (parsed.data.otp !== session.remoteOtp) {
      return apiError('OTP tidak valid', 401)
    }

    const grant = createIndodeskSessionGrant({
      sessionId: session.id,
      userId: session.userId,
      teknisiId: session.teknisiId,
      remoteId: session.remoteId,
      remoteOtp: session.remoteOtp,
    })

    return apiSuccess({
      sessionId: session.id,
      grant,
      remoteId: session.remoteId,
      status: session.status,
      confirmDeadlineAt: session.confirmDeadlineAt?.toISOString() ?? null,
    })
  } catch (e) {
    console.error('[INODESK_UNLOCK]', e)
    return apiError('Gagal membuka sesi IndoDesk', 500)
  }
}
