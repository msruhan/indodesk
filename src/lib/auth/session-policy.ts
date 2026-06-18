/** Idle session lifetime (seconds). No activity beyond this → logout required. */
export const SESSION_IDLE_SECONDS = Number(
  process.env.SESSION_IDLE_SECONDS ?? 2 * 60 * 60,
)

export const SESSION_IDLE_MS = SESSION_IDLE_SECONDS * 1000

/** How often Auth.js may extend the session cookie on server activity (0 = every request). */
export const SESSION_UPDATE_AGE_SECONDS = Number(
  process.env.SESSION_UPDATE_AGE_SECONDS ?? 0,
)

export function isSessionIdleExpired(lastActivitySec: number, nowSec = Math.floor(Date.now() / 1000)): boolean {
  return nowSec - lastActivitySec > SESSION_IDLE_SECONDS
}
