import { History, LayoutDashboard, ShoppingBag, Store, Users } from '@/lib/icons'
import type { IconType } from '@/lib/icons-types'

export type UserBottomNavItem = {
  icon: IconType
  label: string
  href: string
  activePrefixes?: string[]
}

/** Mobile bottom nav untuk user login: Dashboard, Market, Layanan, Toko, Riwayat. */
export const USER_BOTTOM_NAV_ITEMS: readonly UserBottomNavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/user/dashboard',
    activePrefixes: [
      '/user/dashboard',
      '/user/orders',
      '/user/konsultasi',
      '/user/rekber',
      '/user/akun',
      '/user/bantuan',
      '/user/help',
      '/user/tickets',
      '/user/chat',
    ],
  },
  {
    icon: ShoppingBag,
    label: 'Market',
    href: '/marketplace',
    activePrefixes: ['/marketplace', '/topup', '/cart'],
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
  {
    icon: History,
    label: 'Riwayat',
    href: '/user/riwayat',
    activePrefixes: ['/user/riwayat', '/user/orders/imei'],
  },
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
