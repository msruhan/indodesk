import { z } from 'zod'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { generateBackupCodesForUser } from '@/lib/auth/backup-codes'
import { verifySecondFactor } from '@/lib/auth/verify-2fa'
import { RATE_LIMITS, withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'

export const dynamic = 'force-dynamic'

const schema = z.object({
  password: z.string().min(1),
  code: z.string().min(1),
})

export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const rl = await withRateLimit(
    req,
    ['2fa', 'backup-regenerate', session.user.id],
    RATE_LIMITS.sensitiveUser,
  )
  if (!rl.allowed) return rateLimitResponse(rl)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiError('Password dan kode 2FA wajib diisi')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, twoFactorEnabled: true, twoFactorSecret: true },
  })
  if (!user?.twoFactorEnabled) {
    return apiError('2FA belum aktif', 400)
  }
  if (!user.password || !(await compare(parsed.data.password, user.password))) {
    return apiError('Password tidak valid', 401)
  }

  const ok2fa = await verifySecondFactor({
    userId: session.user.id,
    input: parsed.data.code,
    totpSecret: user.twoFactorSecret,
  })
  if (!ok2fa) return apiError('Kode 2FA tidak valid', 401)

  const codes = await generateBackupCodesForUser(session.user.id)
  return apiSuccess({ codes, message: 'Simpan kode cadangan ini — hanya ditampilkan sekali.' })
}
