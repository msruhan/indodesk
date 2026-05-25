'use client'

import {
  LayoutDashboard,
  UserCircle,
  History,
  HelpCircle,
  Laptop,
  MessageCircle,
  Package,
  ShoppingBag,
  CheckSquare,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'

const userNavItems: readonly SidebarNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/user/dashboard', section: 'Ringkasan' },
  { icon: ShoppingBag, label: 'Order Saya', href: '/user/orders', section: 'Layanan' },
  { icon: Package, label: 'Order Layanan', href: '/user/orders/imei', section: 'Layanan' },
  { icon: MessageCircle, label: 'Konsultasi', href: '/user/konsultasi', section: 'Layanan' },
  { icon: CheckSquare, label: 'Inspeksi', href: '/user/inspeksi', section: 'Layanan' },
  { icon: Laptop, label: 'Remote', href: '/user/remote', section: 'Layanan' },
  { icon: History, label: 'Riwayat Transaksi', href: '/user/riwayat', section: 'Keuangan' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: UserCircle, label: 'Akun Saya', href: '/user/akun' },
  { icon: HelpCircle, label: 'Bantuan & Dukungan', href: '/user/help' },
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
