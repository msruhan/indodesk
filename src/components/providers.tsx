'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { PublicProviders } from '@/components/public-providers'
import { isPublicShellPath } from '@/lib/public-shell-paths'

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
  const pathname = usePathname()
  // Re-evaluate on client navigation — stale server flag from /login breaks useChat on /teknisi, /remote, etc.
  const shell =
    pathname != null
      ? isPublicShellPath(pathname, false)
      : publicShell

  if (shell) {
    return <PublicProviders cspNonce={cspNonce}>{children}</PublicProviders>
  }

  return (
    <PublicProviders cspNonce={cspNonce} sessionRefetch>
      <HeavyProviders>{children}</HeavyProviders>
    </PublicProviders>
  )
}
