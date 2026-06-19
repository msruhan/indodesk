import { compare } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { extractRequestContext } from '@/lib/activity-log'
import { checkTeknisiLoginGuard } from '@/lib/teknisi-login-guard'
import {
  AccountLockedError,
  checkLockout,
  recordLoginFailure,
} from '@/lib/lockout'
import { getClientIp, RATE_LIMITS, withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'
import { isLoginEmailVerified, LOGIN_EMAIL_NOT_VERIFIED_MESSAGE } from '@/lib/auth/login-email-guard'
import {
  COMING_SOON_ADMIN_ONLY_LOGIN_MESSAGE,
  isComingSoonEnabled,
} from '@/lib/coming-soon-server'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/** Pre-login check: validates credentials and reports if TOTP is required. */
export async function POST(req: Request) {
  try {
  const ip = getClientIp(req)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return apiError('Email atau password tidak valid')
  }

  const email = parsed.data.email.toLowerCase().trim()
  const rl = await withRateLimit(req, ['auth', 'check-login', ip, email], RATE_LIMITS.auth)
  if (!rl.allowed) return rateLimitResponse(rl, { req, key: `auth:check-login:${ip}` })

  const ctx = extractRequestContext(req)

  try {
    await checkLockout(email)
  } catch (e) {
    if (e instanceof AccountLockedError) {
      return apiError(
        'Akun terkunci sementara. Coba lagi nanti atau reset password.',
        423,
        { code: 'ACCOUNT_LOCKED', lockedUntil: e.lockedUntil.toISOString() },
      )
    }
    throw e
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        role: true,
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: true,
      },
    })

    if (!user?.password) {
      await recordLoginFailure({ email, ip: ctx.ip, userAgent: ctx.userAgent })
      return apiError('Email atau password salah', 401)
    }

    const valid = await compare(parsed.data.password, user.password)
    if (!valid) {
      const lockedUntil = await recordLoginFailure({
        email,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      })
      if (lockedUntil) {
        return apiError(
          'Terlalu banyak percobaan gagal. Akun terkunci sementara.',
          423,
          { code: 'ACCOUNT_LOCKED', lockedUntil: lockedUntil.toISOString() },
        )
      }
      return apiError('Email atau password salah', 401)
    }

    if (!isLoginEmailVerified(user)) {
      return apiError(LOGIN_EMAIL_NOT_VERIFIED_MESSAGE, 403, { code: 'EMAIL_NOT_VERIFIED' })
    }

    const teknisiGuard = await checkTeknisiLoginGuard(user.id, user.role)
    if (!teknisiGuard.allowed) {
      return apiError(teknisiGuard.message, 403)
    }

    if (!user.isActive) {
      return apiError('Akun tidak aktif. Hubungi dukungan Bantoo.', 403, {
        code: 'ACCOUNT_INACTIVE',
      })
    }

    if ((await isComingSoonEnabled()) && user.role !== 'ADMIN') {
      return apiError(COMING_SOON_ADMIN_ONLY_LOGIN_MESSAGE, 403, { code: 'COMING_SOON' })
    }

    return apiSuccess({ requires2FA: user.twoFactorEnabled })
  } catch (e) {
    console.error('[AUTH_CHECK_LOGIN_POST]', e)
    return apiError('Gagal memverifikasi login', 500)
  }
  } catch (e) {
    console.error('[AUTH_CHECK_LOGIN_POST_OUTER]', e)
    return apiError('Gagal memverifikasi login', 500)
  }
}
