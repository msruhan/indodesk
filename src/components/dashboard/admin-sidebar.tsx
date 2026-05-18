'use client'

import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  HelpCircle,
  CheckSquare,
  ShoppingBag,
  Image,
  Bell,
  Download,
  Smartphone,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'

const adminNavItems: readonly SidebarNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', section: 'Overview' },
  { icon: Users, label: 'Management', href: '/admin/management', section: 'Akun' },
  { icon: ShoppingBag, label: 'Services', href: '/admin/produk', section: 'Akun' },
  { icon: Smartphone, label: 'IMEI & Server', href: '/admin/imei', section: 'Akun' },
  { icon: CheckSquare, label: 'Approval', href: '/admin/approval', section: 'Operasional', badge: 3 },
  { icon: Image, label: 'Banner Marketplace', href: '/admin/banners', section: 'Konten' },
  { icon: Bell, label: 'Notifikasi', href: '/admin/notifications', section: 'Konten' },
  { icon: Download, label: 'Download IndoDesk', href: '/admin/indodesk', section: 'Konten' },
  { icon: Briefcase, label: 'Lowongan Kerja', href: '/admin/lowongan', section: 'Mitra' },
  { icon: BarChart3, label: 'Laporan', href: '/admin/laporan', section: 'Analitik' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
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
