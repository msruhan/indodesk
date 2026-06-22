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
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import {
  canAccessInspectionService,
  canAccessKonsultasiService,
  canAccessRekberService,
} from '@/lib/platform-settings-shared'

const baseNavItems: readonly Omit<SidebarNavItem, 'badge'>[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/teknisi/dashboard', section: 'Ringkasan' },
  { icon: TrendingUp, label: 'Analitik', href: '/teknisi/analitik', section: 'Ringkasan' },
  { icon: Store, label: 'Profil Toko', href: '/teknisi/toko', section: 'Katalog' },
  { icon: ShoppingBag, label: 'Iklan Produk', href: '/teknisi/produk', section: 'Katalog' },
  { icon: MessageSquare, label: 'Iklan Konsultasi', href: '/teknisi/iklan-konsultasi', section: 'Katalog' },
  { icon: Package, label: 'Pesanan Masuk', href: '/teknisi/pesanan', section: 'Layanan' },
  { icon: MessageCircle, label: 'Konsultasi', href: '/teknisi/konsultasi', section: 'Layanan' },
  { icon: CheckSquare, label: 'Inspeksi', href: '/teknisi/inspeksi', section: 'Layanan' },
  { icon: Shield, label: 'Transaksi Aman', href: '/teknisi/rekber', section: 'Layanan' },
  { icon: ShoppingCart, label: 'Pesanan', href: '/teknisi/orders', section: 'Belanja' },
  { icon: History, label: 'Riwayat Transaksi', href: '/teknisi/saldo', section: 'Keuangan' },
]

const KONSULTASI_HREFS = new Set(['/teknisi/iklan-konsultasi', '/teknisi/konsultasi'])
const INSPEKSI_HREFS = new Set(['/teknisi/inspeksi'])
const REKBER_HREFS = new Set(['/teknisi/rekber'])

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: UserCircle, label: 'Profil', href: '/teknisi/profil' },
  { icon: HelpCircle, label: 'Pusat Bantuan', href: '/teknisi/bantuan' },
]

export function TeknisiSidebar() {
  const hydrated = useHydrated()
  const { flags } = useFeatureFlags()
  const [konsultasiPending, setKonsultasiPending] = useState(0)
  const [marketplacePending, setMarketplacePending] = useState(0)
  const [inspectionPending, setInspectionPending] = useState(0)
  const [ticketUnread, setTicketUnread] = useState(0)

  const visibleNavItems = useMemo(
    () =>
      baseNavItems.filter((item) => {
        if (KONSULTASI_HREFS.has(item.href) && !canAccessKonsultasiService('TEKNISI', flags)) {
          return false
        }
        if (INSPEKSI_HREFS.has(item.href) && !canAccessInspectionService('TEKNISI', flags)) {
          return false
        }
        if (REKBER_HREFS.has(item.href) && !canAccessRekberService('TEKNISI', flags)) {
          return false
        }
        return true
      }),
    [flags],
  )

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
    return visibleNavItems.map((item) => {
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
  }, [hydrated, visibleNavItems, konsultasiPending, marketplacePending, inspectionPending])

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
