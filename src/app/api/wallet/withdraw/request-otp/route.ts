import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { requireEmailVerifiedUser } from '@/lib/require-email-verified'
import { sendWithdrawEmailOtp, WithdrawOtpError } from '@/lib/wallet/withdraw-otp'
import { isSmtpConfigured } from '@/lib/smtp-settings'
import { withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'

export const dynamic = 'force-dynamic'

const postSchema = z.object({
  amount: z.number().int().positive().max(100_000_000).optional(),
})

export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const emailGate = await requireEmailVerifiedUser(session.user.id)
  if (!emailGate.ok) return emailGate.error

  const rl = await withRateLimit(req, ['wallet', 'withdraw-otp', session.user.id], {
    limit: 3,
    windowSeconds: 600,
  })
  if (!rl.allowed) return rateLimitResponse(rl)

  let body: unknown = {}
  try {
    const text = await req.text()
    if (text.trim()) body = JSON.parse(text)
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    })
    if (!user?.email) {
      return apiError('Email akun tidak ditemukan', 400)
    }

    const smtpOk = await isSmtpConfigured()
    if (!smtpOk && process.env.NODE_ENV === 'production') {
      return apiError(
        'SMTP belum dikonfigurasi. Konfigurasi di Admin → Profil → Pengaturan SMTP sebelum penarikan.',
        503,
        { code: 'SMTP_NOT_CONFIGURED' },
      )
    }

    const result = await sendWithdrawEmailOtp(session.user.id, user.email, {
      amount: parsed.data.amount,
      userName: user.name,
    })

    return apiSuccess({
      ...result,
      smtpConfigured: smtpOk,
      message: smtpOk
        ? `Kode OTP dikirim ke ${result.maskedEmail}`
        : 'Kode OTP dikirim (mode pengembangan — periksa log server yang sudah disamarkan).',
    })
  } catch (e) {
    if (e instanceof WithdrawOtpError && e.code === 'SMTP_NOT_CONFIGURED') {
      return apiError(e.message, 503, { code: 'SMTP_NOT_CONFIGURED' })
    }
    console.error('[WALLET_WITHDRAW_REQUEST_OTP]', e)
    return apiError('Gagal mengirim kode OTP', 500)
  }
}
