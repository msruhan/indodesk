'use client'

import { usePathname } from 'next/navigation'
import { PublicProviders } from '@/components/public-providers'
import { AppShellGate } from '@/components/app-shell-gate'
import { isPublicShellPath } from '@/lib/public-shell-paths'

export function Providers({
  children,
  cspNonce,
  publicShell = false,
  comingSoonEnabled = false,
}: {
  children: React.ReactNode
  cspNonce?: string
  /** When true, skip wallet/chat/cart bundles (coming-soon, auth). */
  publicShell?: boolean
  comingSoonEnabled?: boolean
}) {
  const pathname = usePathname()
  const likelyShell =
    pathname != null
      ? isPublicShellPath(pathname, comingSoonEnabled)
      : publicShell

  return (
    <PublicProviders cspNonce={cspNonce} sessionRefetch={!likelyShell}>
      <AppShellGate initialPublicShell={publicShell} comingSoonEnabled={comingSoonEnabled}>
        {children}
      </AppShellGate>
    </PublicProviders>
  )
}
