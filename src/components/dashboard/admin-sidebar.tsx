'use client'

import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  UserCheck,
  Store,
  Shield,
  Briefcase,
  BarChart3,
  Settings,
  HelpCircle,
  CheckSquare,
  MessageCircle,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'

const adminNavItems: readonly SidebarNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Manajemen User', href: '/admin/users' },
  { icon: UserCheck, label: 'Manajemen Teknisi', href: '/admin/teknisi' },
  { icon: ShoppingBag, label: 'Manajemen Produk', href: '/admin/produk' },
  { icon: Store, label: 'Manajemen Toko', href: '/admin/toko' },
  { icon: CheckSquare, label: 'Approval', href: '/admin/approval' },
  { icon: Shield, label: 'Rekber (Escrow)', href: '/admin/rekber' },
  { icon: Briefcase, label: 'Lowongan Kerja', href: '/admin/lowongan' },
  { icon: BarChart3, label: 'Laporan', href: '/admin/laporan' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: MessageCircle, label: 'Chat', href: '/chat' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
  { icon: HelpCircle, label: 'Help & Support', href: '/admin/help' },
]

export function AdminSidebar() {
  return (
    <RoleSidebar
      items={adminNavItems}
      bottomItems={bottomNavItems}
      profile={{
        initials: 'AD',
        name: 'Admin',
        email: 'admin@indoteknizi.com',
      }}
      scope="Admin"
    />
  )
}
