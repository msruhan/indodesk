import { compare } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { checkTeknisiLoginGuard } from '@/lib/teknisi-login-guard'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/** Pre-login check: validates credentials and reports if TOTP is required. */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return apiError('Email atau password tidak valid')
    }

    const email = parsed.data.email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
      },
    })

    if (!user?.password) {
      return apiError('Email atau password salah', 401)
    }

    if (!user.isActive) {
      return apiError('Akun dinonaktifkan. Hubungi admin.', 403)
    }

    const valid = await compare(parsed.data.password, user.password)
    if (!valid) {
      return apiError('Email atau password salah', 401)
    }

    const teknisiGuard = await checkTeknisiLoginGuard(user.id, user.role)
    if (!teknisiGuard.allowed) {
      return apiError(teknisiGuard.message, 403)
    }

    return apiSuccess({ requires2FA: user.twoFactorEnabled })
  } catch (e) {
    console.error('[AUTH_CHECK_LOGIN_POST]', e)
    return apiError('Gagal memverifikasi login', 500)
  }
}
