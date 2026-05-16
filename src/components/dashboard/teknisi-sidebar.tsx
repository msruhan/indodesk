'use client'

import {
  LayoutDashboard,
  ShoppingBag,
  UserCircle,
  Store,
  Wallet,
  MessageCircle,
  TrendingUp,
  Settings,
  HelpCircle,
  Laptop,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'

const teknisiNavItems: readonly SidebarNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/teknisi/dashboard', section: 'Overview' },
  { icon: UserCircle, label: 'Profil Teknisi', href: '/teknisi/profil', section: 'Profil' },
  { icon: Store, label: 'Toko HP', href: '/teknisi/toko', section: 'Profil' },
  { icon: ShoppingBag, label: 'Produk & Software', href: '/teknisi/produk', section: 'Katalog' },
  { icon: MessageCircle, label: 'Konsultasi', href: '/teknisi/konsultasi', section: 'Layanan', badge: 1 },
  { icon: Laptop, label: 'Remote', href: '/teknisi/remote', section: 'Layanan' },
  { icon: Wallet, label: 'Saldo & Transaksi', href: '/teknisi/saldo', section: 'Keuangan' },
  { icon: TrendingUp, label: 'Analitik', href: '/teknisi/analitik', section: 'Analitik' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: Settings, label: 'Settings', href: '/teknisi/settings' },
  { icon: HelpCircle, label: 'Help & Support', href: '/teknisi/help' },
]

export function TeknisiSidebar() {
  return (
    <RoleSidebar
      items={teknisiNavItems}
      bottomItems={bottomNavItems}
      profile={{
        initials: 'TK',
        name: 'Teknisi',
        email: 'teknisi@indoteknizi.com',
      }}
      scope="Teknisi"
    />
  )
}
