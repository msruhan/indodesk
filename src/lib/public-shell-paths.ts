/** Request header set by middleware for lightweight public pages (no wallet/chat/cart). */
export const PUBLIC_SHELL_HEADER = 'x-bantoo-public-shell'

/**
 * Routes that use PublicProviders only — skips heavy dashboard/marketplace client bundles.
 * `/` is public shell only while coming soon rewrites it to the gate page.
 */
export function isPublicShellPath(pathname: string, comingSoonEnabled = false): boolean {
  if (pathname === '/coming-soon') return true
  if (pathname === '/' && comingSoonEnabled) return true
  if (pathname === '/login' || pathname === '/lupa-password') return true
  if (pathname === '/register' || pathname.startsWith('/register/')) return true
  if (pathname === '/auth/continue' || pathname.startsWith('/auth/')) return true
  return false
}
