'use client'

import {
  LayoutDashboard,
  UserCircle,
  History,
  HelpCircle,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'

const userNavItems: readonly SidebarNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/user/dashboard', section: 'Overview' },
  { icon: History, label: 'Riwayat Transaksi', href: '/user/riwayat' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: UserCircle, label: 'Akun Saya', href: '/user/akun' },
  { icon: HelpCircle, label: 'Help & Support', href: '/user/help' },
]

export function UserSidebar() {
  return (
    <RoleSidebar
      homeHref="/"
      items={userNavItems}
      bottomItems={bottomNavItems}
      profile={{
        initials: 'US',
        name: 'User',
        email: 'user@indoteknizi.com',
      }}
      scope="User"
    />
  )
}
