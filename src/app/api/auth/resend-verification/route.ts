import { compare } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { sendEmailVerification } from '@/lib/email-verification'
import { getClientIp, RATE_LIMITS, withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
    return apiError('Email atau password tidak valid')
  }

  const email = parsed.data.email.toLowerCase().trim()
  const rl = await withRateLimit(
    req,
    ['auth', 'resend-verification', ip, email],
    RATE_LIMITS.emailVerify,
  )
  if (!rl.allowed) return rateLimitResponse(rl)

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, emailVerified: true },
    })

    if (!user?.password) {
      return apiError('Email atau password salah', 401)
    }

    const valid = await compare(parsed.data.password, user.password)
    if (!valid) {
      return apiError('Email atau password salah', 401)
    }

    if (user.emailVerified) {
      return apiSuccess({
        message: 'Email sudah terverifikasi. Silakan login.',
        alreadyVerified: true,
      })
    }

    await sendEmailVerification(user.id, user.email)
    return apiSuccess({
      message:
        'Email verifikasi telah dikirim. Periksa inbox Anda (termasuk folder spam). Tautan berlaku 24 jam.',
    })
  } catch (e) {
    console.error('[AUTH_RESEND_VERIFICATION_POST]', e)
    return apiError('Gagal mengirim email verifikasi', 500)
  }
}
