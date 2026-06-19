'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Package,
  UserCircle,
  Store,
  History,
  MessageCircle,
  TrendingUp,
  HelpCircle,
  CheckSquare,
  MessageSquare,
  Shield,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'
import { useHydrated } from '@/hooks/use-hydrated'

const baseNavItems: readonly Omit<SidebarNavItem, 'badge'>[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/teknisi/dashboard', section: 'Ringkasan' },
  { icon: TrendingUp, label: 'Analitik', href: '/teknisi/analitik', section: 'Ringkasan' },
  { icon: Store, label: 'Profil Toko', href: '/teknisi/toko', section: 'Katalog' },
  { icon: ShoppingBag, label: 'Iklan Produk', href: '/teknisi/produk', section: 'Katalog' },
  { icon: MessageSquare, label: 'Iklan Konsultasi', href: '/teknisi/iklan-konsultasi', section: 'Katalog' },
  { icon: Package, label: 'Pesanan Masuk', href: '/teknisi/pesanan', section: 'Pekerjaan' },
  { icon: MessageCircle, label: 'Konsultasi', href: '/teknisi/konsultasi', section: 'Pekerjaan' },
  { icon: CheckSquare, label: 'Inspeksi', href: '/teknisi/inspeksi', section: 'Pekerjaan' },
  { icon: Shield, label: 'Rekber', href: '/teknisi/rekber', section: 'Pekerjaan' },
  { icon: ShoppingCart, label: 'Pesanan', href: '/teknisi/orders', section: 'Belanja' },
  { icon: History, label: 'Riwayat Transaksi', href: '/teknisi/saldo', section: 'Keuangan' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: UserCircle, label: 'Profil', href: '/teknisi/settings' },
  { icon: HelpCircle, label: 'Pusat Bantuan', href: '/teknisi/bantuan' },
]

export function TeknisiSidebar() {
  const hydrated = useHydrated()
  const [konsultasiPending, setKonsultasiPending] = useState(0)
  const [marketplacePending, setMarketplacePending] = useState(0)
  const [inspectionPending, setInspectionPending] = useState(0)
  const [ticketUnread, setTicketUnread] = useState(0)

  const loadCounts = useCallback(async () => {
    try {
      const [layananRes, ticketRes] = await Promise.all([
        fetch('/api/teknisi/layanan-counts'),
        fetch('/api/tickets/unread-count'),
      ])
      const json = await layananRes.json()
      if (json.success) {
        setKonsultasiPending(json.data.konsultasiPending)
        setMarketplacePending(json.data.marketplacePending ?? 0)
        setInspectionPending(json.data.inspectionPending ?? 0)
      }
      const ticketJson = await ticketRes.json()
      if (ticketJson.success) setTicketUnread(ticketJson.data?.count ?? 0)
    } catch {
      /* ignore — badge optional */
    }
  }, [])

  useEffect(() => {
    void loadCounts()
    const interval = setInterval(() => void loadCounts(), 60_000)
    return () => clearInterval(interval)
  }, [loadCounts])

  const items = useMemo((): readonly SidebarNavItem[] => {
    return baseNavItems.map((item) => {
      if (!hydrated) return item
      if (item.href === '/teknisi/konsultasi' && konsultasiPending > 0) {
        return { ...item, badge: konsultasiPending }
      }
      if (item.href === '/teknisi/pesanan' && marketplacePending > 0) {
        return { ...item, badge: marketplacePending }
      }
      if (item.href === '/teknisi/inspeksi' && inspectionPending > 0) {
        return { ...item, badge: inspectionPending }
      }
      return item
    })
  }, [hydrated, konsultasiPending, marketplacePending, inspectionPending])

  return (
    <RoleSidebar
      homeHref="/"
      items={items}
      bottomItems={bottomNavItems.map((item) => {
        if (!hydrated) return item
        return item.href === '/teknisi/bantuan' && ticketUnread > 0
          ? { ...item, badge: ticketUnread }
          : item
      })}
      profile={{
        initials: 'TK',
        name: 'Teknisi',
        email: 'teknisi@bantoo.in',
      }}
      scope="Teknisi"
    />
  )
}
