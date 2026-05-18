'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { MessageCircle } from '@/lib/icons'
import { chatPathForRole } from '@/lib/role-routes'

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

    const chatPath = `${chatPathForRole((session?.user?.role as UserRole) ?? 'USER')}?peer=${supportAdmin.id}`

    if (status !== 'authenticated' || !session?.user) {
      const callbackUrl = encodeURIComponent(`/user/chat?peer=${supportAdmin.id}`)
      router.push(`/login?callbackUrl=${callbackUrl}`)
      return
    }

    setLoading(true)
    router.push(chatPath)
  }, [router, session, status, supportAdmin])

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
