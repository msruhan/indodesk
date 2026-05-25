'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

function postPresence(online: boolean) {
  void fetch('/api/teknisi/presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ online }),
    keepalive: online === false,
  })
}

/** Sinkronkan isOnline DB dengan sesi teknisi yang sedang login. */
export function TeknisiPresenceSync() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || session?.user?.role !== 'TEKNISI' || !session.user.id) {
      return
    }

    postPresence(true)

    const onUnload = () => postPresence(false)
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [status, session?.user?.id, session?.user?.role])

  return null
}
