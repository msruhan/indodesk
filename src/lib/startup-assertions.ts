import { assertCryptoConfigured } from '@/lib/crypto/encryption'

const PLACEHOLDER_AUTH_SECRETS = new Set([
  'generate-with-openssl-rand-base64-32',
  'dev-secret-change-in-production',
  'changeme',
])

function warnUpstashConfig(): void {
  const hasUpstash = Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  )
  if (hasUpstash) return
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[startup] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production',
    )
  }
  console.warn('[startup] UPSTASH_REDIS_REST_URL not set — rate limits use in-memory store')
}

export function assertProductionInvariants(): void {
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd && process.env.STRESS_TEST_MODE === 'true') {
    throw new Error('[startup] STRESS_TEST_MODE must not be enabled in production')
  }

  const authSecret = process.env.AUTH_SECRET?.trim() ?? ''
  const authWeak =
    !authSecret ||
    authSecret.length < 32 ||
    PLACEHOLDER_AUTH_SECRETS.has(authSecret) ||
    /^dev-/i.test(authSecret)

  if (authWeak) {
    if (isProd) {
      throw new Error(
        '[startup] AUTH_SECRET must be at least 32 characters, not a placeholder, and not start with "dev-"',
      )
    }
    console.warn('[startup] AUTH_SECRET is weak or missing — acceptable only in development')
  }

  try {
    assertCryptoConfigured()
  } catch (e) {
    if (isProd) throw e
    console.warn('[startup] DATA_ENCRYPTION_KEY:', (e as Error).message)
  }

  warnUpstashConfig()
}
