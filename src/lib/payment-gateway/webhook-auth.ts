import { createHmac, timingSafeEqual } from 'node:crypto'

export class PaymentWebhookError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'PaymentWebhookError'
  }
}

function getWebhookSecret(): string | null {
  return process.env.PAYMENT_WEBHOOK_SECRET?.trim() || null
}

function verifyHmacSignature(rawBody: string, secret: string, headers: Headers): boolean {
  const sigHeader =
    headers.get('x-webhook-signature')?.trim() ||
    headers.get('x-payment-signature')?.trim()
  if (!sigHeader) return false

  const provided = sigHeader.replace(/^sha256=/i, '').trim()
  if (!/^[a-f0-9]{64}$/i.test(provided)) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'))
  } catch {
    return false
  }
}

function verifySharedSecretHeader(secret: string, headers: Headers): boolean {
  const provided =
    headers.get('x-webhook-secret')?.trim() ||
    headers.get('x-payment-webhook-secret')?.trim()
  return Boolean(provided && provided === secret)
}

/**
 * Verify webhook in production: HMAC-SHA256 (preferred) or shared secret header.
 * @param rawBody — exact request body bytes as string (for HMAC)
 */
export function assertPaymentWebhookAuthorized(rawBody: string, headers: Headers): void {
  if (process.env.NODE_ENV !== 'production') return

  const secret = getWebhookSecret()
  if (!secret) {
    throw new PaymentWebhookError(
      'PAYMENT_WEBHOOK_SECRET belum dikonfigurasi',
      'WEBHOOK_NOT_CONFIGURED',
    )
  }

  if (verifyHmacSignature(rawBody, secret, headers)) return
  if (verifySharedSecretHeader(secret, headers)) return

  throw new PaymentWebhookError('Webhook tidak terotorisasi', 'WEBHOOK_UNAUTHORIZED')
}

/** @deprecated Use assertPaymentWebhookAuthorized(rawBody, headers) */
export function assertPaymentWebhookAuthorizedHeaders(headers: Headers): void {
  assertPaymentWebhookAuthorized('', headers)
}
