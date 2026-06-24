import { describe, expect, it } from 'vitest'
import { isSessionIdleExpired, SESSION_IDLE_SECONDS, SESSION_REMEMBER_SECONDS } from '@/lib/auth/session-policy'

/** Mirrors session invalidation check in auth.ts jwt callback. */
function isSessionStale(tokenIatSec: number, passwordChangedAt: Date): boolean {
  return tokenIatSec < Math.floor(passwordChangedAt.getTime() / 1000)
}

/** Mirrors session invalidation check in auth.ts jwt callback. */
function isSessionVersionStale(tokenVersion: number, dbVersion: number): boolean {
  return tokenVersion !== dbVersion
}

describe('JWT invalidation after password change', () => {
  it('marks session stale when iat is before passwordChangedAt', () => {
    const changedAt = new Date('2026-05-20T12:00:00Z')
    const iat = Math.floor(new Date('2026-05-19T12:00:00Z').getTime() / 1000)
    expect(isSessionStale(iat, changedAt)).toBe(true)
  })

  it('keeps session valid when iat is after password change', () => {
    const changedAt = new Date('2026-05-19T12:00:00Z')
    const iat = Math.floor(new Date('2026-05-20T12:00:00Z').getTime() / 1000)
    expect(isSessionStale(iat, changedAt)).toBe(false)
  })
})

describe('JWT invalidation after session version bump', () => {
  it('marks session stale when token version differs from DB', () => {
    expect(isSessionVersionStale(3, 4)).toBe(true)
  })

  it('keeps session valid when versions match', () => {
    expect(isSessionVersionStale(4, 4)).toBe(false)
  })
})

describe('session idle expiry', () => {
  it('expires after SESSION_IDLE_SECONDS without activity', () => {
    const last = 1_000_000
    expect(isSessionIdleExpired(last, last + SESSION_IDLE_SECONDS)).toBe(false)
    expect(isSessionIdleExpired(last, last + SESSION_IDLE_SECONDS + 1)).toBe(true)
  })

  it('uses longer window when rememberMe is enabled', () => {
    const last = 1_000_000
    expect(isSessionIdleExpired(last, last + SESSION_IDLE_SECONDS + 1, true)).toBe(false)
    expect(isSessionIdleExpired(last, last + SESSION_REMEMBER_SECONDS + 1, true)).toBe(true)
  })
})
