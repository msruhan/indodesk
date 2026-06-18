import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { confirmPasswordReset } from '@/lib/password-reset'
import { getClientIp, RATE_LIMITS, withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'

export const dynamic = 'force-dynamic'

const schema = z.object({
  token: z.string().min(32),
  password: z.string().min(10),
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
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const rl = await withRateLimit(req, ['auth', 'reset-password', ip], RATE_LIMITS.auth)
  if (!rl.allowed) return rateLimitResponse(rl)

  const result = await confirmPasswordReset(parsed.data.token, parsed.data.password)
  if (!result.ok) {
    return apiError(result.message, 400, result.code ? { code: result.code } : undefined)
  }

  return apiSuccess({ message: 'Password berhasil diubah. Silakan login.' })
}
