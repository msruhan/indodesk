export type TripayMode = 'sandbox' | 'production'

function resolveTripayMode(apiKey: string | undefined): TripayMode {
  const raw = process.env.TRIPAY_MODE?.trim().toLowerCase()
  if (raw === 'production' || raw === 'live') return 'production'
  if (raw === 'sandbox') return 'sandbox'
  // Kredensial sandbox Tripay diawali DEV-
  if (apiKey?.startsWith('DEV-')) return 'sandbox'
  return 'sandbox'
}

export function getTripayConfig() {
  const apiKey = process.env.TRIPAY_API_KEY?.trim()
  const privateKey = process.env.TRIPAY_PRIVATE_KEY?.trim()
  const merchantCode = process.env.TRIPAY_MERCHANT_CODE?.trim()
  const mode = resolveTripayMode(apiKey)
  const callbackUrl =
    process.env.TRIPAY_CALLBACK_URL?.trim() ||
    'https://bantoo.in/api/payments/tripay/callback'

  const baseUrl =
    mode === 'production'
      ? 'https://tripay.co.id/api'
      : 'https://tripay.co.id/api-sandbox'

  const isConfigured = Boolean(apiKey && privateKey && merchantCode)
  const explicitMode = process.env.TRIPAY_MODE?.trim().toLowerCase()
  const modeMismatch =
    isConfigured && apiKey!.startsWith('DEV-') && explicitMode === 'production'

  return {
    apiKey,
    privateKey,
    merchantCode,
    mode,
    callbackUrl,
    baseUrl,
    isConfigured,
    modeMismatch,
  }
}

export function assertTripayConfigured() {
  const cfg = getTripayConfig()
  if (!cfg.isConfigured) {
    throw new Error('TRIPAY_NOT_CONFIGURED')
  }
  return cfg
}
