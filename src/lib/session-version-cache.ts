const CACHE_PREFIX = 'sess:ver:'
const CACHE_TTL_SEC = 60 * 60 * 24 * 30

function cacheKey(userId: string): string {
  return `${CACHE_PREFIX}${userId}`
}

function getUpstashRedis(): import('@upstash/redis').Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null

  const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis')
  return new Redis({ url, token })
}

/** Publish current session version to Upstash for edge middleware revocation checks. */
export async function setCachedSessionVersion(userId: string, version: number): Promise<void> {
  const redis = getUpstashRedis()
  if (!redis) return
  try {
    await redis.set(cacheKey(userId), version, { ex: CACHE_TTL_SEC })
  } catch (e) {
    console.error('[SESSION_VERSION_CACHE_SET]', e)
  }
}

export async function getCachedSessionVersion(userId: string): Promise<number | null> {
  const redis = getUpstashRedis()
  if (!redis) return null
  try {
    const raw = await redis.get<number>(cacheKey(userId))
    return typeof raw === 'number' ? raw : null
  } catch (e) {
    console.error('[SESSION_VERSION_CACHE_GET]', e)
    return null
  }
}
