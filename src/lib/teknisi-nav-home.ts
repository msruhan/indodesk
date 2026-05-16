/**
 * Persists TEKNISI bottom-nav slot 1: Dashboard (workspace) vs Market.
 * Shared routes (e.g. cart) keep the last chosen context.
 */

export type TeknisiNavHomeMode = 'workspace' | 'market'

const STORAGE_KEY = 'indoteknizi:teknisi-nav-home'
const CHANGE_EVENT = 'indoteknizi:teknisi-nav-home-change'

function notifyTeknisiNavHomeChange(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeTeknisiNavHome(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener(CHANGE_EVENT, handler)
  return () => window.removeEventListener(CHANGE_EVENT, handler)
}

const MARKET_PREFIXES = ['/marketplace', '/topup'] as const

const SHARED_PREFIXES = ['/cart'] as const

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** Teknisi workspace: bottom-nav slot 1 = Dashboard; Market via profile menu. */
export function isTeknisiWorkspaceZone(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === '/teknisi' || pathname.startsWith('/teknisi/')
}

export function isTeknisiNavSharedRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return SHARED_PREFIXES.some((p) => matchesPrefix(pathname, p))
}

export function isTeknisiMarketZone(pathname: string): boolean {
  return MARKET_PREFIXES.some((p) => matchesPrefix(pathname, p))
}

export function setTeknisiNavHomeMode(mode: TeknisiNavHomeMode): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, mode)
  notifyTeknisiNavHomeChange()
}

export function getTeknisiNavHomeMode(): TeknisiNavHomeMode {
  if (typeof window === 'undefined') return 'workspace'
  return sessionStorage.getItem(STORAGE_KEY) === 'market' ? 'market' : 'workspace'
}

export function getTeknisiNavHomeModeForPath(pathname: string | null): TeknisiNavHomeMode {
  if (!pathname) return getTeknisiNavHomeMode()

  if (isTeknisiWorkspaceZone(pathname)) return 'workspace'
  if (isTeknisiMarketZone(pathname)) return 'market'

  return getTeknisiNavHomeMode()
}

export function syncTeknisiNavHomeModeFromPath(pathname: string | null): void {
  if (!pathname) return

  if (isTeknisiWorkspaceZone(pathname)) {
    setTeknisiNavHomeMode('workspace')
    return
  }

  if (isTeknisiMarketZone(pathname)) {
    setTeknisiNavHomeMode('market')
  }
}

/** Whether slot 1 should show Dashboard for TEKNISI on this path. */
export function shouldTeknisiDashboardFirstSlot(
  pathname: string | null,
  mode: TeknisiNavHomeMode,
): boolean {
  if (!pathname) return mode === 'workspace'

  if (isTeknisiWorkspaceZone(pathname)) return true
  if (isTeknisiMarketZone(pathname)) return false
  if (isTeknisiNavSharedRoute(pathname)) return mode === 'workspace'

  return mode === 'workspace'
}
