'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  DollarSign,
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
  Package,
  Scales,
  AlertCircle,
  Send,
  Shield,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'
import { useHydrated } from '@/hooks/use-hydrated'

const baseAdminNavItems: readonly SidebarNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', section: 'Ringkasan' },
  { icon: Users, label: 'Manajemen', href: '/admin/management', section: 'Pengguna & Katalog' },
  { icon: ShoppingBag, label: 'Layanan', href: '/admin/produk', section: 'Pengguna & Katalog' },
  { icon: Smartphone, label: 'Digital & Server', href: '/admin/imei', section: 'Pengguna & Katalog' },
  { icon: CheckSquare, label: 'Approval', href: '/admin/approval', section: 'Moderasi & Trust' },
  { icon: FileText, label: 'Inspeksi', href: '/admin/inspeksi', section: 'Moderasi & Trust' },
  { icon: Scales, label: 'Komplain Marketplace', href: '/admin/komplain', section: 'Moderasi & Trust' },
  { icon: Shield, label: 'Rekber', href: '/admin/rekber', section: 'Moderasi & Trust' },
  { icon: Package, label: 'Bukti Packaging', href: '/admin/marketplace-packaging', section: 'Moderasi & Trust' },
  { icon: AlertCircle, label: 'Tiket Dukungan', href: '/admin/tickets', section: 'Dukungan' },
  { icon: CreditCard, label: 'Transaksi', href: '/admin/transactions', section: 'Keuangan' },
  { icon: CreditCard, label: 'Keuangan Marketplace', href: '/admin/keuangan-marketplace', section: 'Keuangan' },
  { icon: DollarSign, label: 'Pendapatan Platform', href: '/admin/pendapatan-platform', section: 'Keuangan' },
  { icon: BarChart3, label: 'Laporan', href: '/admin/laporan', section: 'Analitik & Monitoring' },
  { icon: Eye, label: 'Monitoring', href: '/admin/monitoring', section: 'Analitik & Monitoring' },
  { icon: History, label: 'Log Aktivitas', href: '/admin/logs', section: 'Analitik & Monitoring' },
  { icon: Image, label: 'Banner', href: '/admin/banners', section: 'Konten & Komunikasi' },
  { icon: Bell, label: 'Notifikasi In-App', href: '/admin/notifications', section: 'Konten & Komunikasi' },
  { icon: Send, label: 'Notifikasi Telegram', href: '/admin/telegram-notifications', section: 'Konten & Komunikasi' },
  { icon: Briefcase, label: 'Lowongan Kerja', href: '/admin/lowongan', section: 'Konten & Komunikasi' },
  { icon: Eye, label: 'Visibilitas Menu', href: '/admin/visibility', section: 'Sistem' },
  { icon: Download, label: 'Download IndoDesk', href: '/admin/indodesk', section: 'Sistem' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: UserCircle, label: 'Profil', href: '/admin/settings' },
  { icon: HelpCircle, label: 'Pusat Bantuan', href: '/admin/help' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const hydrated = useHydrated()
  const [pendingApproval, setPendingApproval] = useState<number | undefined>()
  const [ticketUnread, setTicketUnread] = useState<number | undefined>()
  const [rekberDisputed, setRekberDisputed] = useState<number | undefined>()
  const [complaintEscalated, setComplaintEscalated] = useState<number | undefined>()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [approvalRes, ticketRes, rekberRes, marketplaceComplaintRes, rekberComplaintRes] =
          await Promise.all([
          fetch('/api/admin/approval'),
          fetch('/api/admin/tickets/unread-count'),
          fetch('/api/admin/rekber'),
          fetch('/api/admin/marketplace/complaints?status=ESCALATED'),
          fetch('/api/admin/rekber/complaints?status=ESCALATED'),
        ])
        const json = await approvalRes.json()
        const ticketJson = await ticketRes.json()
        const rekberJson = await rekberRes.json()
        const marketplaceComplaintJson = await marketplaceComplaintRes.json()
        const rekberComplaintJson = await rekberComplaintRes.json()
        if (cancelled) return
        if (approvalRes.ok && json.success) {
          const n = json.data?.stats?.pending
          setPendingApproval(typeof n === 'number' && n > 0 ? n : undefined)
        }
        if (ticketRes.ok && ticketJson.success) {
          const c = ticketJson.data?.count
          setTicketUnread(typeof c === 'number' && c > 0 ? c : undefined)
        }
        if (rekberRes.ok && rekberJson.success) {
          const c = Number(rekberJson.data?.stats?.disputed ?? 0) + Number(rekberJson.data?.stats?.held ?? 0)
          setRekberDisputed(c > 0 ? c : undefined)
        }
        const marketplaceEscalated =
          marketplaceComplaintRes.ok && marketplaceComplaintJson.success
            ? (marketplaceComplaintJson.data?.items ?? []).length
            : 0
        const rekberEscalated =
          rekberComplaintRes.ok && rekberComplaintJson.success
            ? (rekberComplaintJson.data?.items ?? []).length
            : 0
        const totalEscalated = marketplaceEscalated + rekberEscalated
        setComplaintEscalated(totalEscalated > 0 ? totalEscalated : undefined)
      } catch {
        if (!cancelled) {
          setPendingApproval(undefined)
          setTicketUnread(undefined)
          setRekberDisputed(undefined)
          setComplaintEscalated(undefined)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pathname])

  const items = useMemo(
    () =>
      baseAdminNavItems.map((item) => {
        if (!hydrated) return item
        if (item.href === '/admin/approval' && pendingApproval) {
          return { ...item, badge: pendingApproval }
        }
        if (item.href === '/admin/tickets' && ticketUnread) {
          return { ...item, badge: ticketUnread }
        }
        if (item.href === '/admin/rekber' && rekberDisputed) {
          return { ...item, badge: rekberDisputed }
        }
        if (item.href === '/admin/komplain' && complaintEscalated) {
          return { ...item, badge: complaintEscalated }
        }
        return item
      }),
    [hydrated, pendingApproval, ticketUnread, rekberDisputed, complaintEscalated],
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
