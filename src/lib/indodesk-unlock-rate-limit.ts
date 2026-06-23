const unlockAttempts = new Map<string, { count: number; resetAt: number }>()

export const INODESK_UNLOCK_MAX_ATTEMPTS = 5
export const INODESK_UNLOCK_WINDOW_MS = 5 * 60 * 1000

export function unlockRateLimitMessage(resetAt: number, now = Date.now()): string {
  const minutesLeft = Math.max(1, Math.ceil((resetAt - now) / 60_000))
  return `Terlalu banyak percobaan OTP. Harap tunggu ${minutesLeft} menit lagi.`
}

export function checkIndodeskUnlockRateLimit(
  tokenHash: string,
  now = Date.now(),
): { message: string; retryAfterMinutes: number } | null {
  const row = unlockAttempts.get(tokenHash)
  if (!row || row.resetAt <= now) {
    unlockAttempts.set(tokenHash, {
      count: 1,
      resetAt: now + INODESK_UNLOCK_WINDOW_MS,
    })
    return null
  }
  if (row.count >= INODESK_UNLOCK_MAX_ATTEMPTS) {
    const retryAfterMinutes = Math.max(1, Math.ceil((row.resetAt - now) / 60_000))
    return {
      message: unlockRateLimitMessage(row.resetAt, now),
      retryAfterMinutes,
    }
  }
  row.count += 1
  return null
}

/** Test helper */
export function resetIndodeskUnlockRateLimitStore() {
  unlockAttempts.clear()
}
