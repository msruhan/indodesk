'use client'

import { SessionProvider } from 'next-auth/react'
import { CspNonceProvider } from '@/components/csp-nonce-provider'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { FeatureFlagsProvider } from '@/contexts/feature-flags-context'

/** Minimal client providers for coming-soon, login, and register flows. */
export function PublicProviders({
  children,
  cspNonce,
  sessionRefetch = false,
}: {
  children: React.ReactNode
  cspNonce?: string
  /** Enable session polling for authenticated app routes. */
  sessionRefetch?: boolean
}) {
  return (
    <CspNonceProvider nonce={cspNonce}>
      <SessionProvider
        refetchOnWindowFocus={sessionRefetch}
        refetchInterval={sessionRefetch ? 5 * 60 : 0}
      >
        <AuthProvider>
          <FeatureFlagsProvider>
            <Toaster position="top-right" richColors />
            {children}
          </FeatureFlagsProvider>
        </AuthProvider>
      </SessionProvider>
    </CspNonceProvider>
  )
}
