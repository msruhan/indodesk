import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { extractRequestContext, logPaymentEvent } from '@/lib/activity-log'
import { requireEmailVerifiedUser } from '@/lib/require-email-verified'
import { assertDailyLimit, WalletPolicyError } from '@/lib/wallet/policy'
import { createWithdrawRequest, serializeWithdrawRequest, WithdrawError } from '@/lib/wallet/withdraw'
import { notifyAdminWithdrawRequest } from '@/lib/telegram/notify'
import { verifyWithdrawAuth, WithdrawAuthError } from '@/lib/wallet/verify-withdraw-auth'
import { withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'

export const dynamic = 'force-dynamic'

const postSchema = z.object({
  amount: z
    .number()
    .int('Jumlah harus bilangan bulat')
    .positive('Jumlah penarikan harus lebih dari 0')
    .max(100_000_000, 'Jumlah penarikan terlalu besar'),
  bankName: z.string().min(2).max(80),
  accountNumber: z.string().min(5).max(40),
  accountHolder: z.string().min(2).max(120),
  emailOtp: z
    .string()
    .min(6, 'Kode OTP email wajib 6 digit')
    .max(8, 'Kode OTP email tidak valid'),
  confirmPassword: z.string().min(1).optional(),
  totp: z.string().min(1).optional(),
  note: z.string().max(200).optional(),
})

export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const rows = await prisma.walletWithdrawRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  })

  return apiSuccess({ items: rows.map(serializeWithdrawRequest) })
}

export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const emailGate = await requireEmailVerifiedUser(session.user.id)
  if (!emailGate.ok) return emailGate.error

  const rl = await withRateLimit(req, ['wallet', 'withdraw', session.user.id], {
    limit: 5,
    windowSeconds: 60,
  })
  if (!rl.allowed) return rateLimitResponse(rl)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  try {
    await verifyWithdrawAuth(session.user.id, {
      emailOtp: parsed.data.emailOtp,
      totp: parsed.data.totp,
      confirmPassword: parsed.data.confirmPassword,
    })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    })
    if (!user) {
      return apiError('User tidak ditemukan', 404)
    }

    await assertDailyLimit({
      userId: session.user.id,
      kind: 'WITHDRAW',
      amount: parsed.data.amount,
    })

    const request = await createWithdrawRequest({
      userId: session.user.id,
      amount: parsed.data.amount,
      bankName: parsed.data.bankName,
      accountNumber: parsed.data.accountNumber,
      accountHolder: parsed.data.accountHolder,
      note: parsed.data.note,
    })

    const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } })

    const ctx = extractRequestContext(req)
    void logPaymentEvent({
      action: 'payment.withdraw.request',
      severity: 'SUCCESS',
      summary: `Pengajuan penarikan Rp ${parsed.data.amount.toLocaleString('id-ID')} — ${user.name ?? user.email}`,
      actor: {
        id: session.user.id,
        name: user.name,
        email: user.email,
        role: session.user.role,
      },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: {
        requestId: request.id,
        amount: parsed.data.amount,
        riskScore: request.riskScore,
        balanceAfter: wallet?.balance.toString(),
      },
    })

    void notifyAdminWithdrawRequest(request.id).catch((e) => {
      console.error('[WITHDRAW_ADMIN_TELEGRAM]', e)
    })

    return apiSuccess({
      request: serializeWithdrawRequest(request),
      balance: wallet?.balance.toString() ?? '0',
    })
  } catch (e) {
    if (e instanceof WithdrawAuthError) {
      const status = e.code.startsWith('INVALID') ? 401 : 400
      return apiError(e.message, status, { code: e.code })
    }
    if (e instanceof WalletPolicyError) {
      return apiError(e.message, 400, { code: e.code })
    }
    if (e instanceof WithdrawError) {
      if (e.code === 'INSUFFICIENT_BALANCE') {
        return apiError('Saldo tidak cukup', 402, { code: e.code })
      }
      return apiError(e.message, 400, { code: e.code })
    }
    console.error('[WALLET_WITHDRAW_POST]', e)
    return apiError('Gagal memproses pengajuan penarikan', 500)
  }
}
