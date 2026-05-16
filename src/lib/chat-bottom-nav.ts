export type ChatBottomNavMode = 'dashboard' | 'public'

const STORAGE_KEY = 'indoteknizi:chat-bottom-nav'

const CHAT_ROUTE_PREFIXES = ['/admin/chat', '/user/chat', '/teknisi/chat'] as const

export function isChatRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return CHAT_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function setChatBottomNavMode(mode: ChatBottomNavMode): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, mode)
}

export function getChatBottomNavMode(): ChatBottomNavMode {
  if (typeof window === 'undefined') return 'dashboard'
  const stored = sessionStorage.getItem(STORAGE_KEY)
  return stored === 'public' ? 'public' : 'dashboard'
}
