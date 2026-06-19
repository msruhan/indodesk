'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  LayoutDashboard,
  UserCircle,
  History,
  HelpCircle,
  MessageCircle,
  ShoppingBag,
  CheckSquare,
  Shield,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'

const userNavItems: readonly SidebarNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/user/dashboard', section: 'Ringkasan' },
  { icon: ShoppingBag, label: 'Pesanan', href: '/user/orders', section: 'Belanja' },
  { icon: MessageCircle, label: 'Konsultasi', href: '/user/konsultasi', section: 'Layanan' },
  { icon: CheckSquare, label: 'Inspeksi', href: '/user/inspeksi', section: 'Layanan' },
  { icon: Shield, label: 'Rekber', href: '/user/rekber', section: 'Layanan' },
  { icon: History, label: 'Riwayat Transaksi', href: '/user/riwayat', section: 'Keuangan' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: UserCircle, label: 'Profil', href: '/user/akun' },
  { icon: HelpCircle, label: 'Pusat Bantuan', href: '/user/bantuan' },
]

export function UserSidebar() {
  const [ticketUnread, setTicketUnread] = useState(0)

  const loadTicketUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets/unread-count')
      const json = await res.json()
      if (json.success) setTicketUnread(json.data?.count ?? 0)
    } catch {
      /* optional badge */
    }
  }, [])

  useEffect(() => {
    void loadTicketUnread()
    const interval = setInterval(() => void loadTicketUnread(), 60_000)
    return () => clearInterval(interval)
  }, [loadTicketUnread])

  const bottomItems = bottomNavItems.map((item) =>
    item.href === '/user/bantuan' && ticketUnread > 0
      ? { ...item, badge: ticketUnread }
      : item,
  )

  return (
    <RoleSidebar
      homeHref="/"
      items={userNavItems}
      bottomItems={bottomItems}
      profile={{
        initials: 'US',
        name: 'User',
        email: 'user@bantoo.in',
      }}
      scope="User"
    />
  )
}
