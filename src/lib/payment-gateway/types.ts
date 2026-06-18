export type CreateConsultationPaymentInput = {
  sessionId: string
  amount: number
  userId: string
  description: string
  returnUrl: string
}

export type PaymentCreateResult = {
  redirectUrl: string
  externalRef: string
  provider: string
  expiresAt: Date
}

export type PaymentWebhookResult = {
  externalRef: string
  status: 'PAID' | 'FAILED' | 'EXPIRED'
  amount: number
}

export interface PaymentGatewayProvider {
  name: string
  createPayment(input: CreateConsultationPaymentInput): Promise<PaymentCreateResult>
  verifyWebhook(payload: unknown, headers: Headers, rawBody?: string): Promise<PaymentWebhookResult>
}
