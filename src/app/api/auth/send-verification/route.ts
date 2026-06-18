import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { sendEmailVerification } from '@/lib/email-verification'
import { RATE_LIMITS, withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const rl = await withRateLimit(
    req,
    ['auth', 'send-verification', session.user.id],
    RATE_LIMITS.emailVerify,
  )
  if (!rl.allowed) return rateLimitResponse(rl)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  })
  if (!user?.email) return apiError('Email tidak ditemukan', 404)
  if (user.emailVerified) {
    return apiSuccess({ message: 'Email sudah terverifikasi' })
  }

  try {
    await sendEmailVerification(session.user.id, user.email)
    return apiSuccess({ message: 'Email verifikasi telah dikirim' })
  } catch (e) {
    console.error('[AUTH_SEND_VERIFICATION_POST]', e)
    return apiError('Gagal mengirim email verifikasi', 500)
  }
}
