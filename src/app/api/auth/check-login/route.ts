import { compare } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'

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

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase().trim() },
      select: { password: true, twoFactorEnabled: true },
    })

    if (!user?.password) {
      return apiError('Email atau password salah', 401)
    }

    const valid = await compare(parsed.data.password, user.password)
    if (!valid) {
      return apiError('Email atau password salah', 401)
    }

    return apiSuccess({ requires2FA: user.twoFactorEnabled })
  } catch (e) {
    console.error('[AUTH_CHECK_LOGIN_POST]', e)
    return apiError('Gagal memverifikasi login', 500)
  }
}
