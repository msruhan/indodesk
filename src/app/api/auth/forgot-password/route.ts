import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { requestPasswordReset } from '@/lib/password-reset'
import { getClientIp, RATE_LIMITS, withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  const ip = getClientIp(req)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return apiError('Email tidak valid')
  }

  const email = parsed.data.email.toLowerCase().trim()
  const rl = await withRateLimit(req, ['auth', 'forgot-password', ip, email], RATE_LIMITS.auth)
  if (!rl.allowed) return rateLimitResponse(rl)

  try {
    await requestPasswordReset(email)
    return apiSuccess({
      message:
        'Jika email terdaftar, tautan reset password telah dikirim. Periksa inbox Anda (berlaku 30 menit).',
    })
  } catch (e) {
    console.error('[AUTH_FORGOT_PASSWORD_POST]', e)
    return apiError('Terjadi kesalahan server', 500)
  }
}
