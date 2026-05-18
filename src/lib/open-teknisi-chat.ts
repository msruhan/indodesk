import type { UserRole } from '@prisma/client'
import { chatPathForRole } from '@/lib/role-routes'

type OpenTeknisiChatOptions = {
  teknisiUserId: string
  isAuthenticated: boolean
  role?: UserRole
  openChatWithPeer: (peerId: string) => void
  navigate: (path: string) => void
}

/** Desktop: popup chat. Mobile: halaman chat penuh. Guest: login dulu. */
export function openTeknisiChat({
  teknisiUserId,
  isAuthenticated,
  role = 'USER',
  openChatWithPeer,
  navigate,
}: OpenTeknisiChatOptions) {
  const chatPath = `${chatPathForRole(role)}?peer=${teknisiUserId}`

  if (!isAuthenticated) {
    navigate(`/login?callbackUrl=${encodeURIComponent(chatPath)}`)
    return
  }

  const isDesktop =
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

  if (isDesktop) {
    openChatWithPeer(teknisiUserId)
    return
  }

  navigate(chatPath)
}
