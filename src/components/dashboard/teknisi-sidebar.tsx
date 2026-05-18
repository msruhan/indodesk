'use client'

import {
  LayoutDashboard,
  ShoppingBag,
  UserCircle,
  Store,
  History,
  MessageCircle,
  TrendingUp,
  HelpCircle,
  Laptop,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'

const teknisiNavItems: readonly SidebarNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/teknisi/dashboard', section: 'Overview' },
  { icon: Store, label: 'Toko', href: '/teknisi/toko', section: 'Profil' },
  { icon: ShoppingBag, label: 'Iklan Produk', href: '/teknisi/produk', section: 'Katalog' },
  { icon: MessageCircle, label: 'Konsultasi', href: '/teknisi/konsultasi', section: 'Layanan', badge: 1 },
  { icon: Laptop, label: 'Remote', href: '/teknisi/remote', section: 'Layanan' },
  { icon: History, label: 'Riwayat Transaksi', href: '/teknisi/saldo', section: 'Keuangan' },
  { icon: TrendingUp, label: 'Analitik', href: '/teknisi/analitik', section: 'Analitik' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: UserCircle, label: 'Akun Saya', href: '/teknisi/settings' },
  { icon: HelpCircle, label: 'Help & Support', href: '/teknisi/help' },
]

export function TeknisiSidebar() {
  return (
    <RoleSidebar
      homeHref="/"
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
