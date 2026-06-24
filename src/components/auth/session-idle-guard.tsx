'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { completeClientLogout } from '@/lib/auth/client-logout'
import { SESSION_IDLE_MS, SESSION_REMEMBER_MS } from '@/lib/auth/session-policy'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const

/**
 * Signs the user out after SESSION_IDLE_MS without pointer/keyboard activity.
 * Complements server-side JWT maxAge (API navigations also refresh the cookie).
 */
export function SessionIdleGuard() {
  const { data: session, status } = useSession()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleMs = session?.rememberMe ? SESSION_REMEMBER_MS : SESSION_IDLE_MS

  useEffect(() => {
    if (status !== 'authenticated') return

    const scheduleLogout = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void completeClientLogout({ callbackUrl: '/login?reason=idle' }).then(() => {
          window.location.assign('/login?reason=idle')
        })
      }, idleMs)
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
  }, [status, idleMs])

  return null
}
