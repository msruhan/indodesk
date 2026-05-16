import { ShoppingBag, Users, Store, History } from '@/lib/icons'
import type { IconType } from '@/lib/icons-types'

export type UserBottomNavItem = {
  icon: IconType
  label: string
  href: string
  activePrefixes?: string[]
}

/** Single bottom-nav model for logged-in USER role (all pages). */
export const USER_BOTTOM_NAV_ITEMS: readonly UserBottomNavItem[] = [
  {
    icon: ShoppingBag,
    label: 'Market',
    href: '/marketplace',
    activePrefixes: ['/marketplace', '/topup'],
  },
  {
    icon: Users,
    label: 'Layanan',
    href: '/teknisi',
    activePrefixes: ['/teknisi', '/remote', '/rekber'],
  },
  {
    icon: Store,
    label: 'Toko',
    href: '/toko',
    activePrefixes: ['/toko', '/lowongan'],
  },
  { icon: History, label: 'Riwayat', href: '/user/riwayat' },
]

export function isUserBottomNavItemActive(
  item: UserBottomNavItem,
  pathname: string | null,
): boolean {
  if (item.activePrefixes) {
    return item.activePrefixes.some(
      (p) => pathname === p || pathname?.startsWith(`${p}/`),
    )
  }
  return pathname === item.href
}
