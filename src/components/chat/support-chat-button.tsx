'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { useChat } from '@/contexts/chat-context'
import { MessageCircle } from '@/lib/icons'
import { openTeknisiChat } from '@/lib/open-teknisi-chat'

type SupportAdmin = { id: string; name: string }

export function SupportChatButton({
  className,
  size = 'sm',
  variant = 'outline',
  fullWidth = true,
}: {
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'outline' | 'default' | 'secondary'
  fullWidth?: boolean
}) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { openChatWithPeer } = useChat()
  const [supportAdmin, setSupportAdmin] = useState<SupportAdmin | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/chat/support')
        const json = (await res.json()) as {
          success?: boolean
          data?: SupportAdmin
        }
        if (json.success && json.data?.id) {
          setSupportAdmin(json.data)
        }
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const handleClick = useCallback(() => {
    if (!supportAdmin) return

    if (status !== 'authenticated' || !session?.user) {
      const callbackUrl = encodeURIComponent(`/user/chat?peer=${supportAdmin.id}`)
      router.push(`/login?callbackUrl=${callbackUrl}`)
      return
    }

    openTeknisiChat({
      teknisiUserId: supportAdmin.id,
      isAuthenticated: true,
      role: (session.user.role as UserRole) ?? 'USER',
      openChatWithPeer,
      navigate: (path) => {
        setLoading(true)
        router.push(path)
      },
    })
  }, [router, session, status, supportAdmin, openChatWithPeer])

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={fullWidth ? `w-full ${className ?? ''}` : className}
      onClick={handleClick}
      disabled={!supportAdmin || loading}
    >
      <MessageCircle className="h-3.5 w-3.5" />
      {loading ? 'Membuka chat...' : 'Chat dengan Admin'}
    </Button>
  )
}
