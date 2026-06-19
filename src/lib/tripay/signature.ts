import crypto from 'crypto'

/** HMAC-SHA256 signature for Tripay API requests. */
export function tripayApiSignature(merchantCode: string, merchantRef: string, amount: number) {
  const privateKey = process.env.TRIPAY_PRIVATE_KEY?.trim()
  if (!privateKey) throw new Error('TRIPAY_PRIVATE_KEY_MISSING')
  const payload = `${merchantCode}${merchantRef}${amount}`
  return crypto.createHmac('sha256', privateKey).update(payload).digest('hex')
}

/** Verify callback signature from X-Callback-Signature header. */
export function verifyTripayCallbackSignature(rawBody: string, signatureHeader: string | null) {
  const privateKey = process.env.TRIPAY_PRIVATE_KEY?.trim()
  if (!privateKey || !signatureHeader) return false
  const expected = crypto.createHmac('sha256', privateKey).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
  } catch {
    return false
  }
}
