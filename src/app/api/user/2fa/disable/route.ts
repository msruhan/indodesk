import { compare } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { verifySecondFactor } from '@/lib/auth/verify-2fa'
import { bumpSessionVersion } from '@/lib/session-version'
import { RATE_LIMITS, withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'

export const dynamic = 'force-dynamic'

const schema = z.object({
  password: z.string().min(1, 'Password wajib diisi'),
  code: z.string().min(1, 'Kode 2FA wajib diisi'),
})

export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const rl = await withRateLimit(
    req,
    ['2fa', 'disable', session.user.id],
    RATE_LIMITS.sensitiveUser,
  )
  if (!rl.allowed) return rateLimitResponse(rl)

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, twoFactorSecret: true, twoFactorEnabled: true },
    })
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      return apiError('2FA belum aktif')
    }
    if (!user.password) {
      return apiError('Akun tidak memiliki password lokal')
    }

    const validPassword = await compare(parsed.data.password, user.password)
    if (!validPassword) {
      return apiError('Password tidak sesuai', 401)
    }

    const ok2fa = await verifySecondFactor({
      userId: session.user.id,
      input: parsed.data.code,
      totpSecret: user.twoFactorSecret,
    })
    if (!ok2fa) {
      return apiError('Kode 2FA tidak valid', 401)
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    })
    await prisma.backupCode.deleteMany({ where: { userId: session.user.id } })
    await bumpSessionVersion(session.user.id)

    return apiSuccess({ enabled: false })
  } catch (e) {
    console.error('[USER_2FA_DISABLE_POST]', e)
    return apiError('Gagal menonaktifkan 2FA', 500)
  }
}
