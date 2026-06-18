import { randomBytes } from 'crypto'
import type {
  CreateConsultationPaymentInput,
  PaymentCreateResult,
  PaymentGatewayProvider,
  PaymentWebhookResult,
} from '@/lib/payment-gateway/types'
import { assertPaymentWebhookAuthorized } from '@/lib/payment-gateway/webhook-auth'

const PAYMENT_TTL_MS = 30 * 60 * 1000

export class StubPaymentGatewayProvider implements PaymentGatewayProvider {
  name = 'stub'

  async createPayment(input: CreateConsultationPaymentInput): Promise<PaymentCreateResult> {
    const externalRef = `stub_${input.sessionId}_${randomBytes(4).toString('hex')}`
    const expiresAt = new Date(Date.now() + PAYMENT_TTL_MS)
    const redirectUrl = `${input.returnUrl}${input.returnUrl.includes('?') ? '&' : '?'}pgRef=${encodeURIComponent(externalRef)}`

    return {
      redirectUrl,
      externalRef,
      provider: this.name,
      expiresAt,
    }
  }

  async verifyWebhook(payload: unknown, headers: Headers, rawBody?: string): Promise<PaymentWebhookResult> {
    const bodyText = rawBody ?? JSON.stringify(payload)
    assertPaymentWebhookAuthorized(bodyText, headers)
    const body = payload as Record<string, unknown>
    const externalRef = String(body.externalRef ?? '')
    const status = body.status === 'PAID' ? 'PAID' : 'FAILED'
    const amount = Number(body.amount ?? 0)
    return { externalRef, status, amount }
  }
}

export function getPaymentGatewayProvider(): PaymentGatewayProvider {
  return new StubPaymentGatewayProvider()
}

export const KONSULTASI_PAYMENT_TTL_MS = PAYMENT_TTL_MS
