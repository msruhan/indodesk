'use client'

import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  CreditCard,
  Clock,
  BarChart3,
  Settings,
  HelpCircle,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'

const mainNavItems: readonly SidebarNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FolderKanban, label: 'Projects', href: '/dashboard/projects' },
  { icon: Users, label: 'Clients', href: '/dashboard/clients' },
  { icon: FileText, label: 'Invoices', href: '/dashboard/invoices' },
  { icon: CreditCard, label: 'Payments', href: '/dashboard/payments' },
  { icon: Clock, label: 'Time Tracking', href: '/dashboard/time' },
  { icon: BarChart3, label: 'Reports', href: '/dashboard/reports' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  { icon: HelpCircle, label: 'Help & Support', href: '/dashboard/help' },
]

export function Sidebar() {
  return (
    <RoleSidebar
      items={mainNavItems}
      bottomItems={bottomNavItems}
      profile={{
        initials: 'JD',
        name: 'John Doe',
        email: 'john@example.com',
      }}
      scope="Workspace"
    />
  )
}
