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
  { icon: LayoutDashboard, label: 'Dashboard', href: '/teknisi/dashboard' },
  { icon: ShoppingBag, label: 'Produk & Software', href: '/teknisi/produk' },
  { icon: UserCircle, label: 'Profil Teknisi', href: '/teknisi/profil' },
  { icon: Store, label: 'Toko HP', href: '/teknisi/toko' },
  { icon: Wallet, label: 'Saldo & Transaksi', href: '/teknisi/saldo' },
  { icon: MessageCircle, label: 'Konsultasi', href: '/teknisi/konsultasi' },
  { icon: Laptop, label: 'Remote', href: '/teknisi/remote' },
  { icon: TrendingUp, label: 'Analitik', href: '/teknisi/analitik' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: MessageCircle, label: 'Chat', href: '/chat' },
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
