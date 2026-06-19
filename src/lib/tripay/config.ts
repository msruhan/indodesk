export type TripayMode = 'sandbox' | 'production'

export function getTripayConfig() {
  const apiKey = process.env.TRIPAY_API_KEY?.trim()
  const privateKey = process.env.TRIPAY_PRIVATE_KEY?.trim()
  const merchantCode = process.env.TRIPAY_MERCHANT_CODE?.trim()
  const mode = (process.env.TRIPAY_MODE?.trim() || 'sandbox') as TripayMode
  const callbackUrl =
    process.env.TRIPAY_CALLBACK_URL?.trim() ||
    'https://bantoo.in/api/payments/tripay/callback'

  const baseUrl =
    mode === 'production'
      ? 'https://tripay.co.id/api'
      : 'https://tripay.co.id/api-sandbox'

  return {
    apiKey,
    privateKey,
    merchantCode,
    mode,
    callbackUrl,
    baseUrl,
    isConfigured: Boolean(apiKey && privateKey && merchantCode),
  }
}

export function assertTripayConfigured() {
  const cfg = getTripayConfig()
  if (!cfg.isConfigured) {
    throw new Error('TRIPAY_NOT_CONFIGURED')
  }
  return cfg
}
