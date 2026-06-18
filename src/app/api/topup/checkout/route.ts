import { z } from 'zod'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { processTopupCheckout } from '@/lib/topup-checkout'
import { requireEmailVerifiedUser } from '@/lib/require-email-verified'
import { RATE_LIMITS, withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'

export const dynamic = 'force-dynamic'

const checkoutSchema = z.object({
  productSlug: z.string().min(1),
  denominationSku: z.string().min(1),
  accountId: z.string().min(3).max(120),
  serverId: z.string().max(80).optional(),
  email: z.string().email().optional().or(z.literal('')),
  whatsapp: z.string().max(20).optional(),
  paymentMethod: z.enum(['saldo']),
  promoCode: z.string().max(32).optional(),
})

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  PAYMENT_NOT_SUPPORTED: {
    message: 'Metode pembayaran belum tersedia. Gunakan saldo IndoTeknizi.',
    status: 400,
  },
  PRODUCT_NOT_FOUND: { message: 'Produk atau nominal tidak ditemukan', status: 404 },
  INVALID_ACCOUNT: { message: 'ID akun tidak valid', status: 400 },
  SERVER_REQUIRED: { message: 'Server ID wajib diisi', status: 400 },
  WALLET_NOT_FOUND: { message: 'Wallet tidak ditemukan', status: 400 },
  INSUFFICIENT_BALANCE: { message: 'Saldo tidak cukup. Top-up saldo dulu ya.', status: 402 },
  INVALID_TOTAL: { message: 'Total pembayaran tidak valid', status: 400 },
  INVALID_MSISDN: {
    message: 'Nomor tujuan tidak valid. Gunakan format 08xxxxxxxxxx.',
    status: 400,
  },
  ADMIN_NOT_ALLOWED: {
    message: 'Admin tidak dapat checkout topup. Gunakan akun user.',
    status: 403,
  },
}

export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const emailGate = await requireEmailVerifiedUser(session.user.id)
  if (!emailGate.ok) return emailGate.error

  const rl = await withRateLimit(req, ['checkout', 'topup', session.user.id], RATE_LIMITS.checkout)
  if (!rl.allowed) return rateLimitResponse(rl)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  try {
    const result = await processTopupCheckout(
      session.user.id,
      session.user.name,
      session.user.email,
      session.user.role,
      {
        ...parsed.data,
        email: parsed.data.email || undefined,
        promoCode: parsed.data.promoCode,
      },
    )
    return apiSuccess(result, 201)
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    const mapped = ERROR_MAP[code]
    if (mapped) return apiError(mapped.message, mapped.status)
    console.error('[TOPUP_CHECKOUT]', e)
    return apiError('Gagal checkout top up', 500)
  }
}
