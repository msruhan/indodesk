'use client'

import { signOut, useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { SESSION_IDLE_MS } from '@/lib/auth/session-policy'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const

/**
 * Signs the user out after SESSION_IDLE_MS without pointer/keyboard activity.
 * Complements server-side JWT maxAge (API navigations also refresh the cookie).
 */
export function SessionIdleGuard() {
  const { status } = useSession()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return

    const scheduleLogout = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void signOut({ callbackUrl: '/login?reason=idle' })
      }, SESSION_IDLE_MS)
    }

    const onActivity = () => scheduleLogout()

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true })
    }
    scheduleLogout()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity)
      }
    }
  }, [status])

  return null
}
