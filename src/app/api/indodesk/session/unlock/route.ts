import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { createIndodeskSessionGrant } from '@/lib/indodesk-auth'
import { requireIndodeskDevice } from '@/lib/indodesk-device-auth'
import { findUnlockEligibleSessionForDevice } from '@/lib/indodesk-session'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  otp: z.string().min(4).max(32),
})

const unlockAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

function checkUnlockRateLimit(tokenHash: string): string | null {
  const now = Date.now()
  const row = unlockAttempts.get(tokenHash)
  if (!row || row.resetAt <= now) {
    unlockAttempts.set(tokenHash, { count: 1, resetAt: now + WINDOW_MS })
    return null
  }
  if (row.count >= MAX_ATTEMPTS) {
    return 'Terlalu banyak percobaan OTP. Coba lagi nanti.'
  }
  row.count += 1
  return null
}

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

  const rateLimited = checkUnlockRateLimit(token.slice(0, 16))
  if (rateLimited) {
    return apiError(rateLimited, 429)
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
