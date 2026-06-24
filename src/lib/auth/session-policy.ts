/** Idle session lifetime (seconds). No activity beyond this → logout required. */
export const SESSION_IDLE_SECONDS = Number(
  process.env.SESSION_IDLE_SECONDS ?? 2 * 60 * 60,
)

/** Extended session when user checks "Ingat saya" on login (default 30 days). */
export const SESSION_REMEMBER_SECONDS = Number(
  process.env.SESSION_REMEMBER_SECONDS ?? 30 * 24 * 60 * 60,
)

export const SESSION_IDLE_MS = SESSION_IDLE_SECONDS * 1000
export const SESSION_REMEMBER_MS = SESSION_REMEMBER_SECONDS * 1000

/** How often Auth.js may extend the session cookie on server activity (0 = every request). */
export const SESSION_UPDATE_AGE_SECONDS = Number(
  process.env.SESSION_UPDATE_AGE_SECONDS ?? 0,
)

export function getSessionIdleSeconds(rememberMe = false): number {
  return rememberMe ? SESSION_REMEMBER_SECONDS : SESSION_IDLE_SECONDS
}

export function isSessionIdleExpired(
  lastActivitySec: number,
  nowSec = Math.floor(Date.now() / 1000),
  rememberMe = false,
): boolean {
  return nowSec - lastActivitySec > getSessionIdleSeconds(rememberMe)
}
