'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ChatButton } from '@/components/chat/chat-button'
import { ChatPopup } from '@/components/chat/chat-popup'

function isDedicatedChatPage(pathname: string | null): boolean {
  if (!pathname) return false
  return (
    pathname === '/user/chat' ||
    pathname.startsWith('/user/chat/') ||
    pathname === '/teknisi/chat' ||
    pathname.startsWith('/teknisi/chat/') ||
    pathname === '/admin/chat' ||
    pathname.startsWith('/admin/chat/')
  )
}

/** FAB + popup chat untuk desktop; header chat tetap di mobile. */
export function ChatFloatingWidget() {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user || isDedicatedChatPage(pathname)) return null

  return (
    <>
      <ChatButton />
      <ChatPopup />
    </>
  )
}
