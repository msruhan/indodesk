const REPLAY_TTL_SEC = 90
const memoryKeys = new Map<string, number>()

export class TotpReplayError extends Error {
  readonly code = 'INVALID_TOTP_REPLAY'

  constructor() {
    super('Kode 2FA sudah digunakan. Tunggu kode baru dari aplikasi authenticator.')
    this.name = 'TotpReplayError'
  }
}

function replayKey(userId: string, code: string): string {
  return `totp-replay:${userId}:${code.replace(/\s/g, '')}`
}

async function markConsumedUpstash(key: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return false

  const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis')
  const redis = new Redis({ url, token })
  const result = await redis.set(key, '1', { nx: true, ex: REPLAY_TTL_SEC })
  return result === 'OK'
}

function markConsumedMemory(key: string): boolean {
  const now = Date.now()
  const existing = memoryKeys.get(key)
  if (existing && existing > now) return false
  memoryKeys.set(key, now + REPLAY_TTL_SEC * 1000)
  return true
}

/**
 * Mark TOTP code as used for this user (90s window). Throws if already consumed.
 * Call only after cryptographic TOTP verification succeeds.
 */
export async function consumeTotpCode(userId: string, code: string): Promise<void> {
  const key = replayKey(userId, code)
  const hasUpstash =
    Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim()) &&
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim())

  if (hasUpstash) {
    const ok = await markConsumedUpstash(key)
    if (!ok) throw new TotpReplayError()
    return
  }

  if (!markConsumedMemory(key)) throw new TotpReplayError()
}
