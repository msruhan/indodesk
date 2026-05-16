'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile/bottom-nav'
import { DashboardBottomNav, DashboardMobileSpacer } from '@/components/mobile/dashboard-bottom-nav'
import {
  getChatBottomNavMode,
  isChatRoute,
  type ChatBottomNavMode,
} from '@/lib/chat-bottom-nav'

function useChatBottomNavOnChatPage(): ChatBottomNavMode | null {
  const pathname = usePathname()
  const onChat = isChatRoute(pathname)
  const [mode, setMode] = useState<ChatBottomNavMode | null>(null)

  useEffect(() => {
    if (onChat) {
      setMode(getChatBottomNavMode())
    } else {
      setMode(null)
    }
  }, [pathname, onChat])

  if (!onChat) return null
  return mode ?? 'dashboard'
}

/**
 * Mobile bottom nav for dashboard shells.
 * USER role always uses the unified public BottomNav (Market, Layanan, Toko, Riwayat).
 * On chat: admin/teknisi use dashboard vs public nav based on entry point.
 */
export function ShellBottomNav() {
  const { user } = useAuth()
  const chatMode = useChatBottomNavOnChatPage()

  if (user?.role === 'USER') {
    return <BottomNav />
  }

  const usePublic = chatMode === 'public'
  return usePublic ? <BottomNav /> : <DashboardBottomNav />
}

export function ShellMobileSpacer() {
  const { user } = useAuth()
  const chatMode = useChatBottomNavOnChatPage()

  if (user?.role === 'USER') {
    return <MobileSafeAreaSpacer />
  }

  const usePublic = chatMode === 'public'
  return usePublic ? <MobileSafeAreaSpacer /> : <DashboardMobileSpacer />
}
