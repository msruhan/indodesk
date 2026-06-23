import { describe, expect, it, beforeEach } from 'vitest'
import {
  INODESK_UNLOCK_MAX_ATTEMPTS,
  INODESK_UNLOCK_WINDOW_MS,
  checkIndodeskUnlockRateLimit,
  resetIndodeskUnlockRateLimitStore,
  unlockRateLimitMessage,
} from './indodesk-unlock-rate-limit'

describe('indodesk unlock rate limit', () => {
  beforeEach(() => {
    resetIndodeskUnlockRateLimitStore()
  })

  it('allows attempts up to the configured maximum', () => {
    const key = 'device-token-hash'
    const start = 1_700_000_000_000
    for (let i = 0; i < INODESK_UNLOCK_MAX_ATTEMPTS; i++) {
      expect(checkIndodeskUnlockRateLimit(key, start + i)).toBeNull()
    }
    const blocked = checkIndodeskUnlockRateLimit(key, start + INODESK_UNLOCK_MAX_ATTEMPTS)
    expect(blocked?.message).toMatch(/Harap tunggu 5 menit lagi/)
    expect(blocked?.retryAfterMinutes).toBe(5)
  })

  it('uses a five minute window', () => {
    expect(INODESK_UNLOCK_WINDOW_MS).toBe(5 * 60 * 1000)
  })

  it('reports remaining minutes until reset', () => {
    const resetAt = 1_700_000_000_000 + 3 * 60_000
    expect(unlockRateLimitMessage(resetAt, 1_700_000_000_000)).toBe(
      'Terlalu banyak percobaan OTP. Harap tunggu 3 menit lagi.',
    )
  })
})
