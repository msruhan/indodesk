'use client'

import { User, UserCircle } from '@/lib/icons'
import { headerIconClass } from '@/components/mobile/header-action-styles'

type HeaderProfileTriggerIconProps = {
  isLoading?: boolean
  isLoggedIn?: boolean
}

/** Ikon pemicu menu profil di header mobile — orang (bukan inisial). */
export function HeaderProfileTriggerIcon({
  isLoading = false,
  isLoggedIn = false,
}: HeaderProfileTriggerIconProps) {
  if (isLoading) {
    return <span className="h-4 w-4 animate-pulse rounded-full bg-surface-300" />
  }
  if (isLoggedIn) {
    return <User className={headerIconClass} />
  }
  return <UserCircle className={headerIconClass} />
}
