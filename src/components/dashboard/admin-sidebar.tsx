'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  UserCircle,
  HelpCircle,
  CheckSquare,
  ShoppingBag,
  Image,
  Bell,
  Download,
  Smartphone,
  Eye,
  History,
  CreditCard,
  FileText,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'

const baseAdminNavItems: readonly SidebarNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', section: 'Ringkasan' },
  { icon: Users, label: 'Manajemen', href: '/admin/management', section: 'Akun' },
  { icon: ShoppingBag, label: 'Layanan', href: '/admin/produk', section: 'Akun' },
  { icon: Smartphone, label: 'IMEI & Server', href: '/admin/imei', section: 'Akun' },
  { icon: CheckSquare, label: 'Approval', href: '/admin/approval', section: 'Operasional' },
  { icon: FileText, label: 'Inspeksi', href: '/admin/inspeksi', section: 'Operasional' },
  { icon: Eye, label: 'Monitoring', href: '/admin/monitoring', section: 'Operasional' },
  { icon: CreditCard, label: 'Transaksi', href: '/admin/transactions', section: 'Operasional' },
  { icon: History, label: 'Log Aktivitas', href: '/admin/logs', section: 'Operasional' },
  { icon: Image, label: 'Banner', href: '/admin/banners', section: 'Konten' },
  { icon: Bell, label: 'Notifikasi', href: '/admin/notifications', section: 'Konten' },
  { icon: Download, label: 'Download IndoDesk', href: '/admin/indodesk', section: 'Konten' },
  { icon: Briefcase, label: 'Lowongan Kerja', href: '/admin/lowongan', section: 'Mitra' },
  { icon: BarChart3, label: 'Laporan', href: '/admin/laporan', section: 'Analitik' },
  { icon: Eye, label: 'Visibilitas Menu', href: '/admin/visibility', section: 'Konfigurasi' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: UserCircle, label: 'Akun Saya', href: '/admin/settings' },
  { icon: HelpCircle, label: 'Bantuan & Dukungan', href: '/admin/help' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [pendingApproval, setPendingApproval] = useState<number | undefined>()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/admin/approval')
        const json = await res.json()
        if (cancelled) return
        if (res.ok && json.success) {
          const n = json.data?.stats?.pending
          setPendingApproval(typeof n === 'number' && n > 0 ? n : undefined)
        }
      } catch {
        if (!cancelled) setPendingApproval(undefined)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pathname])

  const items = useMemo(
    () =>
      baseAdminNavItems.map((item) =>
        item.href === '/admin/approval' && pendingApproval
          ? { ...item, badge: pendingApproval }
          : item,
      ),
    [pendingApproval],
  )

  return (
    <RoleSidebar
      items={items}
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
