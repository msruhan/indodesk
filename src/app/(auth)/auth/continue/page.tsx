'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { UserRole } from '@/contexts/auth-context'

function isSafeCallbackUrl(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//')
}

function dashboardForRole(role: UserRole | undefined): string {
  if (role === 'ADMIN') return '/admin/dashboard'
  if (role === 'TEKNISI') return '/teknisi/dashboard'
  return '/user/dashboard'
}

function AuthContinueInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return
    if (status !== 'authenticated') {
      router.replace('/login')
      return
    }

    const callbackUrl = searchParams.get('callbackUrl')
    if (callbackUrl && isSafeCallbackUrl(callbackUrl)) {
      router.replace(callbackUrl)
      return
    }

    router.replace(dashboardForRole(session.user.role as UserRole | undefined))
  }, [status, session, router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-sm text-surface-600">
      Menyelesaikan login…
    </div>
  )
}

export default function AuthContinuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-6 text-sm text-surface-600">
          Menyelesaikan login…
        </div>
      }
    >
      <AuthContinueInner />
    </Suspense>
  )
}
