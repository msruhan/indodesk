import {
  checkRateLimit as checkInMemory,
  getClientIp,
  type RateLimitConfig,
  type RateLimitResult,
  RATE_LIMITS,
} from '@/lib/rate-limit'
import { logRateLimitBlocked } from '@/lib/security/request-blocks'

export type { RateLimitConfig, RateLimitResult }
export { RATE_LIMITS, getClientIp }

export interface RateLimitStore {
  check(key: string, config: RateLimitConfig): Promise<RateLimitResult>
}

class InMemoryRateLimitStore implements RateLimitStore {
  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    return checkInMemory(key, config)
  }
}

class UpstashRateLimitStore implements RateLimitStore {
  constructor(
    private readonly limiterFactory: (
      limit: number,
      windowSeconds: number,
    ) => { limit: (id: string) => Promise<{ success: boolean; remaining: number; reset: number }> },
  ) {}

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      const limiter = this.limiterFactory(config.limit, config.windowSeconds)
      const result = await limiter.limit(key)
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      }
    } catch (e) {
      console.error('[rate-limit] Upstash check failed — allowing request', e)
      return { allowed: true, remaining: config.limit, resetAt: Date.now() + config.windowSeconds * 1000 }
    }
  }
}

let storeSingleton: RateLimitStore | null = null
let upstashWarned = false

function createUpstashStore(): RateLimitStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null

  return new UpstashRateLimitStore((limit, windowSeconds) => {
    // Dynamic import keeps dev builds working without Upstash configured.
    const { Ratelimit } = require('@upstash/ratelimit') as typeof import('@upstash/ratelimit')
    const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis')
    const redis = new Redis({ url, token })
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: false,
    })
    return limiter
  })
}

export function createRateLimitStore(): RateLimitStore {
  if (storeSingleton) return storeSingleton

  const upstash = createUpstashStore()
  if (upstash) {
    storeSingleton = upstash
    return storeSingleton
  }

  if (!upstashWarned && process.env.NODE_ENV === 'production') {
    upstashWarned = true
    console.warn(
      '[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — using in-memory rate limit (single instance only)',
    )
  }
  storeSingleton = new InMemoryRateLimitStore()
  return storeSingleton
}

export async function withRateLimit(
  req: Request,
  keyParts: string[],
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const store = createRateLimitStore()
  const key = keyParts.filter(Boolean).join(':')
  return store.check(key, config)
}

export function rateLimitResponse(result: RateLimitResult, ctx?: { req?: Request; key?: string }): Response {
  if (ctx?.req) {
    logRateLimitBlocked(ctx.req, ctx.key)
  }
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
  return Response.json(
    { success: false, error: 'Terlalu banyak permintaan. Coba lagi nanti.', code: 'RATE_LIMITED' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    },
  )
}
