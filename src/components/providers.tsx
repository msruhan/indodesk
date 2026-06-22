'use client'

import dynamic from 'next/dynamic'
import { PublicProviders } from '@/components/public-providers'

const HeavyProviders = dynamic(
  () => import('@/components/heavy-providers').then((m) => m.HeavyProviders),
  { ssr: true },
)

export function Providers({
  children,
  cspNonce,
  publicShell = false,
}: {
  children: React.ReactNode
  cspNonce?: string
  /** When true, skip wallet/chat/cart bundles (coming-soon, auth). */
  publicShell?: boolean
}) {
  if (publicShell) {
    return <PublicProviders cspNonce={cspNonce}>{children}</PublicProviders>
  }

  return (
    <PublicProviders cspNonce={cspNonce} sessionRefetch>
      <HeavyProviders>{children}</HeavyProviders>
    </PublicProviders>
  )
}
