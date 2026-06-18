import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { PaymentWebhookError } from '@/lib/payment-gateway/webhook-auth'
import { secureKonsultasiPaymentByRef } from '@/lib/konsultasi-payment'
import { getPaymentGatewayProvider } from '@/lib/payment-gateway'
import { logSecurityEvent } from '@/lib/activity-log'

export const dynamic = 'force-dynamic'

const webhookSchema = z.object({
  externalRef: z.string().min(1),
  amount: z.number().int().positive().optional(),
  status: z.enum(['PAID', 'FAILED']).optional(),
})

export async function POST(req: Request) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return apiError('Body tidak valid')
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody) as unknown
  } catch {
    return apiError('Body tidak valid')
  }

  try {
    const pg = getPaymentGatewayProvider()
    const verified = await pg.verifyWebhook(body, req.headers, rawBody)
    const parsed = webhookSchema.safeParse(body)
    const externalRef = parsed.success ? parsed.data.externalRef : verified.externalRef

    if (verified.status !== 'PAID') {
      return apiSuccess({ ok: false, status: verified.status })
    }

    const result = await secureKonsultasiPaymentByRef(externalRef, verified.amount || parsed.data?.amount)
    if (!result.ok) return apiError(result.error)

    return apiSuccess({ ok: true, sessionId: result.sessionId })
  } catch (e) {
    if (e instanceof PaymentWebhookError) {
      void logSecurityEvent({
        action: 'payment.webhook.rejected',
        severity: 'WARNING',
        summary: `Webhook pembayaran ditolak: ${e.code}`,
        metadata: { code: e.code },
      })
      return apiError(e.message, e.code === 'WEBHOOK_UNAUTHORIZED' ? 401 : 503, { code: e.code })
    }
    console.error('[KONSULTASI_PAYMENT_WEBHOOK]', e)
    return apiError('Gagal memproses webhook', 500)
  }
}
