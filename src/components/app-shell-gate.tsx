'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { isPublicShellPath } from '@/lib/public-shell-paths'

const HeavyProviders = dynamic(
  () => import('@/components/heavy-providers').then((m) => m.HeavyProviders),
  { ssr: true },
)

type AppShellGateProps = {
  children: React.ReactNode
  /** Server hint from middleware on first paint. */
  initialPublicShell?: boolean
  comingSoonEnabled?: boolean
}

/**
 * Chooses lightweight vs heavy client providers.
 * Admin bypasses public shell so navbar/profile works during coming-soon soft launch.
 */
export function AppShellGate({
  children,
  initialPublicShell = false,
  comingSoonEnabled = false,
}: AppShellGateProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const shell =
    user?.role === 'ADMIN'
      ? false
      : pathname != null
        ? isPublicShellPath(pathname, comingSoonEnabled)
        : initialPublicShell

  if (shell) return children

  return <HeavyProviders>{children}</HeavyProviders>
}
