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
  Laptop,
  CheckSquare,
} from '@/lib/icons'
import { RoleSidebar, type SidebarNavItem } from './role-sidebar'

const baseNavItems: readonly Omit<SidebarNavItem, 'badge'>[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/teknisi/dashboard', section: 'Ringkasan' },
  { icon: Store, label: 'Toko', href: '/teknisi/toko', section: 'Profil' },
  { icon: ShoppingBag, label: 'Iklan Produk', href: '/teknisi/produk', section: 'Katalog' },
  { icon: Package, label: 'Pesanan', href: '/teknisi/pesanan', section: 'Katalog' },
  { icon: ShoppingCart, label: 'Order Saya', href: '/teknisi/orders', section: 'Katalog' },
  { icon: MessageCircle, label: 'Konsultasi', href: '/teknisi/konsultasi', section: 'Layanan' },
  { icon: CheckSquare, label: 'Inspeksi', href: '/teknisi/inspeksi', section: 'Layanan' },
  { icon: Laptop, label: 'Remote', href: '/teknisi/remote', section: 'Layanan' },
  { icon: History, label: 'Riwayat Transaksi', href: '/teknisi/saldo', section: 'Keuangan' },
  { icon: TrendingUp, label: 'Analitik', href: '/teknisi/analitik', section: 'Analitik' },
]

const bottomNavItems: readonly SidebarNavItem[] = [
  { icon: UserCircle, label: 'Akun Saya', href: '/teknisi/settings' },
  { icon: HelpCircle, label: 'Bantuan & Dukungan', href: '/teknisi/help' },
]

export function TeknisiSidebar() {
  const [konsultasiPending, setKonsultasiPending] = useState(0)
  const [remoteWaiting, setRemoteWaiting] = useState(0)
  const [marketplacePending, setMarketplacePending] = useState(0)
  const [inspectionPending, setInspectionPending] = useState(0)

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/teknisi/layanan-counts')
      const json = await res.json()
      if (json.success) {
        setKonsultasiPending(json.data.konsultasiPending)
        setRemoteWaiting(json.data.remoteWaiting)
        setMarketplacePending(json.data.marketplacePending ?? 0)
      }
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
      if (item.href === '/teknisi/konsultasi' && konsultasiPending > 0) {
        return { ...item, badge: konsultasiPending }
      }
      if (item.href === '/teknisi/remote' && remoteWaiting > 0) {
        return { ...item, badge: remoteWaiting }
      }
      if (item.href === '/teknisi/pesanan' && marketplacePending > 0) {
        return { ...item, badge: marketplacePending }
      }
      if (item.href === '/teknisi/inspeksi' && inspectionPending > 0) {
        return { ...item, badge: inspectionPending }
      }
      return item
    })
  }, [konsultasiPending, remoteWaiting, marketplacePending, inspectionPending])

  return (
    <RoleSidebar
      homeHref="/"
      items={items}
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
