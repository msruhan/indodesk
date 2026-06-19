import {
  DEFAULT_COMING_SOON_CONFIG,
  type ComingSoonConfig,
} from '@/lib/coming-soon-shared'

const CACHE_KEY = 'platform:coming_soon'
const CACHE_TTL_SEC = 60 * 60 * 24 * 30

function getUpstashRedis(): import('@upstash/redis').Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null

  const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis')
  return new Redis({ url, token })
}

export async function setCachedComingSoon(config: ComingSoonConfig): Promise<void> {
  const redis = getUpstashRedis()
  if (!redis) return
  try {
    await redis.set(CACHE_KEY, config, { ex: CACHE_TTL_SEC })
  } catch (e) {
    console.error('[COMING_SOON_CACHE_SET]', e)
  }
}

export async function getCachedComingSoon(): Promise<ComingSoonConfig | null> {
  const redis = getUpstashRedis()
  if (!redis) return null
  try {
    const raw = await redis.get<ComingSoonConfig>(CACHE_KEY)
    if (!raw || typeof raw !== 'object') return null
    return {
      enabled: Boolean(raw.enabled),
      launchAt: raw.launchAt ?? null,
      headline: raw.headline ?? DEFAULT_COMING_SOON_CONFIG.headline,
      message: raw.message ?? DEFAULT_COMING_SOON_CONFIG.message,
    }
  } catch (e) {
    console.error('[COMING_SOON_CACHE_GET]', e)
    return null
  }
}
