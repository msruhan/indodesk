/**
 * Persists which label/href occupies the first USER bottom-nav slot (Market vs Dashboard).
 * Shared routes (Layanan, Toko, Riwayat) keep the last chosen context.
 */

export type UserNavHomeMode = 'market' | 'dashboard'

const STORAGE_KEY = 'indoteknizi:user-nav-home'
const CHANGE_EVENT = 'indoteknizi:user-nav-home-change'

function notifyUserNavHomeChange(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeUserNavHome(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener(CHANGE_EVENT, handler)
  return () => window.removeEventListener(CHANGE_EVENT, handler)
}

const MARKET_PREFIXES = ['/marketplace', '/topup'] as const

/** Routes that must not flip Market ↔ Dashboard context (including cart). */
const SHARED_PREFIXES = [
  '/cart',
  '/teknisi',
  '/toko',
  '/lowongan',
  '/remote',
  '/rekber',
  '/user/riwayat',
] as const

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function isUserNavSharedRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return SHARED_PREFIXES.some((p) => matchesPrefix(pathname, p))
}

export function isUserMarketZone(pathname: string): boolean {
  return MARKET_PREFIXES.some((p) => matchesPrefix(pathname, p))
}

/** User dashboard shell routes (not Riwayat — that stays context-neutral). */
export function isUserDashboardZone(pathname: string): boolean {
  if (!pathname.startsWith('/user/')) return false
  return !matchesPrefix(pathname, '/user/riwayat')
}

export function setUserNavHomeMode(mode: UserNavHomeMode): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, mode)
  notifyUserNavHomeChange()
}

export function getUserNavHomeMode(): UserNavHomeMode {
  if (typeof window === 'undefined') return 'market'
  return sessionStorage.getItem(STORAGE_KEY) === 'dashboard' ? 'dashboard' : 'market'
}

/** Read mode for render (no storage writes). Shared routes use persisted context. */
export function getUserNavHomeModeForPath(pathname: string | null): UserNavHomeMode {
  if (!pathname) return getUserNavHomeMode()

  if (isUserDashboardZone(pathname)) return 'dashboard'
  if (isUserMarketZone(pathname)) return 'market'

  return getUserNavHomeMode()
}

/** Persist context when entering dashboard or market zones (call in useLayoutEffect). */
export function syncUserNavHomeModeFromPath(pathname: string | null): void {
  if (!pathname) return

  if (isUserDashboardZone(pathname)) {
    setUserNavHomeMode('dashboard')
    return
  }

  if (isUserMarketZone(pathname)) {
    setUserNavHomeMode('market')
  }
}

/** @deprecated Use getUserNavHomeModeForPath + syncUserNavHomeModeFromPath */
export function resolveUserNavHomeMode(pathname: string | null): UserNavHomeMode {
  const mode = getUserNavHomeModeForPath(pathname)
  syncUserNavHomeModeFromPath(pathname)
  return mode
}
