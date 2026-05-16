'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ShoppingCart } from '@/lib/icons'
import {
  headerIconButtonClass,
  headerIconClass,
} from '@/components/mobile/header-action-styles'
import {
  isTeknisiMarketZone,
  isTeknisiWorkspaceZone,
  setTeknisiNavHomeMode,
} from '@/lib/teknisi-nav-home'
import {
  isUserDashboardZone,
  isUserMarketZone,
  setUserNavHomeMode,
} from '@/lib/user-nav-home'

const CART_HREF = '/cart'

/** Mock count until cart state is wired — matches marketplace demo. */
const CART_ITEM_COUNT = 3

type HeaderCartLinkProps = {
  onClick?: () => void
}

export function HeaderCartLink({ onClick }: HeaderCartLinkProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const count = CART_ITEM_COUNT
  const badgeLabel = count > 9 ? '9+' : String(count)

  const handleClick = () => {
    if (pathname) {
      if (user?.role === 'USER') {
        if (isUserDashboardZone(pathname)) {
          setUserNavHomeMode('dashboard')
        } else if (isUserMarketZone(pathname)) {
          setUserNavHomeMode('market')
        }
      } else if (user?.role === 'TEKNISI') {
        if (isTeknisiWorkspaceZone(pathname)) {
          setTeknisiNavHomeMode('workspace')
        } else if (isTeknisiMarketZone(pathname)) {
          setTeknisiNavHomeMode('market')
        }
      }
    }
    onClick?.()
  }

  return (
    <Link
      href={CART_HREF}
      className={headerIconButtonClass}
      aria-label={count > 0 ? `Keranjang, ${count} item` : 'Keranjang'}
      onClick={handleClick}
    >
      <ShoppingCart className={headerIconClass} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-white">
          {badgeLabel}
        </span>
      )}
    </Link>
  )
}
