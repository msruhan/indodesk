'use client'

import {
  LayoutDashboard,
  ShoppingBag,
  MessageCircle,
  Shield,
  History,
  Settings,
  HelpCircle,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'

const userNavItems: readonly SidebarNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/user/dashboard' },
  { icon: ShoppingBag, label: 'Order Saya', href: '/user/orders' },
  { icon: MessageCircle, label: 'Konsultasi', href: '/user/konsultasi' },
  { icon: Shield, label: 'Rekber Saya', href: '/user/rekber' },
  { icon: History, label: 'Riwayat', href: '/user/history' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: MessageCircle, label: 'Chat', href: '/chat' },
  { icon: Settings, label: 'Settings', href: '/user/settings' },
  { icon: HelpCircle, label: 'Help & Support', href: '/user/help' },
]

export function UserSidebar() {
  return (
    <RoleSidebar
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
