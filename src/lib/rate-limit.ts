/**
 * Simple in-memory rate limiter for API routes.
 *
 * @deprecated Prefer `withRateLimit` from `@/lib/rate-limit-store` (Upstash when configured).
 * This module remains the in-memory fallback implementation for `rate-limit-store`.
 */

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup expired entries setiap 5 menit
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export type RateLimitConfig = {
  /** Max requests allowed in the window */
  limit: number
  /** Window duration in seconds */
  windowSeconds: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given key (e.g. IP address or email).
 * Returns whether the request is allowed.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: config.limit - 1, resetAt: now + windowMs }
  }

  if (existing.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { allowed: true, remaining: config.limit - existing.count, resetAt: existing.resetAt }
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const real = req.headers.get('x-real-ip')
  return forwarded?.split(',')[0]?.trim() || real || 'unknown'
}

/** Preset configs */
export const RATE_LIMITS = {
  /** Auth endpoints: 10 requests per 15 minutes per IP */
  auth: { limit: 10, windowSeconds: 15 * 60 } satisfies RateLimitConfig,
  /** API general: 100 requests per minute per IP */
  api: { limit: 100, windowSeconds: 60 } satisfies RateLimitConfig,
  /** Admin heavy endpoints: 30 requests per minute */
  adminHeavy: { limit: 30, windowSeconds: 60 } satisfies RateLimitConfig,
  /** Password change / 2FA disable: 5 per 15 minutes per user */
  sensitiveUser: { limit: 5, windowSeconds: 15 * 60 } satisfies RateLimitConfig,
  /** Checkout: 20 per minute per user */
  checkout: { limit: 20, windowSeconds: 60 } satisfies RateLimitConfig,
  /** Wallet topup request: 10 per 15 minutes per user */
  walletTopup: { limit: 10, windowSeconds: 15 * 60 } satisfies RateLimitConfig,
  /** Chat send: 60 per minute per user */
  chatSend: { limit: 60, windowSeconds: 60 } satisfies RateLimitConfig,
  /** Resend email verification: 3 per 15 minutes per user */
  emailVerify: { limit: 3, windowSeconds: 15 * 60 } satisfies RateLimitConfig,
}
