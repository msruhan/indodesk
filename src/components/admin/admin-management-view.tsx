'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Edit, Trash2, CheckCircle, XCircle, Star, MapPin, Plus, Search, Users, Eye } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { AdminWalletPanel } from '@/components/admin/admin-wallet-panel'

const TAB_KEYS = ['users', 'teknisi', 'toko', 'wallet'] as const
type TabKey = (typeof TAB_KEYS)[number]

const usersSeed = [
  { id: '1', name: 'Budi Santoso', email: 'budi@example.com', role: 'User', status: 'active', joinDate: '2024-01-15', totalOrder: 12 },
  { id: '2', name: 'Siti Nurhaliza', email: 'siti@example.com', role: 'User', status: 'active', joinDate: '2024-02-20', totalOrder: 8 },
  { id: '3', name: 'Rudi Hartono', email: 'rudi@example.com', role: 'User', status: 'inactive', joinDate: '2024-01-10', totalOrder: 5 },
  { id: '4', name: 'Dewi Lestari', email: 'dewi@example.com', role: 'User', status: 'active', joinDate: '2024-03-05', totalOrder: 15 },
  { id: '5', name: 'Ahmad Hidayat', email: 'ahmad@example.com', role: 'Teknisi', status: 'active', joinDate: '2024-01-08', totalOrder: 45 },
]

const teknisiSeed = [
  { id: '1', name: 'Ahmad Hidayat', email: 'ahmad@example.com', rating: 4.9, totalKonsultasi: 567, badge: 'Top Teknisi', status: 'verified' as const },
  { id: '2', name: 'Budi Santoso', email: 'budi.tek@example.com', rating: 4.7, totalKonsultasi: 234, badge: 'Verified', status: 'verified' as const },
  { id: '3', name: 'Rudi Hartono', email: 'rudi.tek@example.com', rating: 4.5, totalKonsultasi: 123, badge: 'Newbie', status: 'pending' as const },
]

const tokoSeed = [
  { id: '1', name: 'HandPhone Center Jakarta', owner: 'Ahmad Hidayat', location: 'Jakarta', rating: 4.8, totalPenjualan: 2341, status: 'approved' },
  { id: '2', name: 'TechSolution Store', owner: 'Budi Santoso', location: 'Bandung', rating: 4.9, totalPenjualan: 1567, status: 'approved' },
  { id: '3', name: 'Mobile Repair Surabaya', owner: 'Rudi Hartono', location: 'Surabaya', rating: 4.6, totalPenjualan: 890, status: 'pending' },
]

export function AdminManagementView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const raw = searchParams.get('tab')
  const activeTab: TabKey = TAB_KEYS.includes(raw as TabKey) ? (raw as TabKey) : 'users'

  const setTab = useCallback(
    (v: string) => {
      const t = TAB_KEYS.includes(v as TabKey) ? v : 'users'
      router.replace(`${pathname}?tab=${t}`, { scroll: false })
    },
    [router, pathname],
  )

  const [qUser, setQUser] = useState('')
  const [qTek, setQTek] = useState('')
  const [qToko, setQToko] = useState('')
  const [qWallet, setQWallet] = useState('')

  const filteredUsers = usersSeed.filter((u) => u.name.toLowerCase().includes(qUser.toLowerCase()) || u.email.toLowerCase().includes(qUser.toLowerCase()))
  const filteredTek = teknisiSeed.filter((t) => t.name.toLowerCase().includes(qTek.toLowerCase()) || t.email.toLowerCase().includes(qTek.toLowerCase()))
  const filteredToko = tokoSeed.filter((t) => t.name.toLowerCase().includes(qToko.toLowerCase()) || t.location.toLowerCase().includes(qToko.toLowerCase()))

  useEffect(() => {
    if (raw === 'produk') { router.replace('/admin/produk'); return }
  }, [raw, router])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Management</h1>
        <p className="mt-0.5 text-[13px] text-surface-500">Pusat manajemen user, teknisi, dan toko.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setTab}>
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-10 w-max flex-nowrap gap-1">
            <TabsTrigger value="users" className="shrink-0 px-3 text-xs sm:px-4">User</TabsTrigger>
            <TabsTrigger value="teknisi" className="shrink-0 px-3 text-xs sm:px-4">Teknisi</TabsTrigger>
            <TabsTrigger value="toko" className="shrink-0 px-3 text-xs sm:px-4">Toko</TabsTrigger>
            <TabsTrigger value="wallet" className="shrink-0 px-3 text-xs sm:px-4">Wallet</TabsTrigger>
          </TabsList>
        </div>

        {/* ===== USERS ===== */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <ToolbarRow placeholder="Cari user atau email..." value={qUser} onChange={setQUser} addLabel="Tambah User" />
          <p className="text-[12px] text-surface-500">{filteredUsers.length} user</p>
          <div className="space-y-2">
            {filteredUsers.map((user, idx) => (
              <motion.div key={user.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-[11px] font-bold text-white">
                    {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
                      <Badge variant={user.role === 'Teknisi' ? 'info' : 'default'} className="text-[9px] px-1.5 py-0">{user.role}</Badge>
                    </div>
                    <p className="truncate text-[11px] text-surface-500">{user.email}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-surface-400">
                      <span>{user.totalOrder} order</span>
                      <span>·</span>
                      <Badge variant={user.status === 'active' ? 'success' : 'default'} className="text-[8px] px-1 py-0">
                        {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink"><Edit className="h-3.5 w-3.5" /></button>
                    <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ===== TEKNISI ===== */}
        <TabsContent value="teknisi" className="mt-4 space-y-4">
          <ToolbarRow placeholder="Cari teknisi..." value={qTek} onChange={setQTek} addLabel="Tambah Teknisi" />
          <p className="text-[12px] text-surface-500">{filteredTek.length} teknisi</p>
          <div className="space-y-2">
            {filteredTek.map((t, idx) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-[11px] font-bold text-white">
                    {t.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-ink">{t.name}</p>
                      <Badge variant={t.badge === 'Top Teknisi' ? 'warning' : t.badge === 'Verified' ? 'success' : 'default'} className="text-[9px] px-1.5 py-0">{t.badge}</Badge>
                    </div>
                    <p className="truncate text-[11px] text-surface-500">{t.email}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-[10px] text-surface-400">
                      <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />{t.rating}</span>
                      <span>{t.totalKonsultasi} sesi</span>
                      <Badge variant={t.status === 'verified' ? 'success' : 'warning'} className="text-[8px] px-1 py-0">
                        {t.status === 'verified' ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <Link href={`/teknisi/${t.id}`}>
                      <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink"><Eye className="h-3.5 w-3.5" /></button>
                    </Link>
                    <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink"><Edit className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ===== TOKO ===== */}
        <TabsContent value="toko" className="mt-4 space-y-4">
          <ToolbarRow placeholder="Cari toko..." value={qToko} onChange={setQToko} addLabel="Tambah Toko" />
          <p className="text-[12px] text-surface-500">{filteredToko.length} toko</p>
          <div className="space-y-2">
            {filteredToko.map((t, idx) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-surface-200/70 bg-surface-50 text-[11px] font-bold text-primary-700">
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-ink">{t.name}</p>
                      <Badge variant={t.status === 'approved' ? 'success' : 'warning'} className="text-[9px] px-1.5 py-0">
                        {t.status === 'approved' ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="truncate text-[11px] text-surface-500">{t.owner}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-[10px] text-surface-400">
                      <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{t.location}</span>
                      <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />{t.rating}</span>
                      <span>{t.totalPenjualan.toLocaleString()} sales</span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink"><Edit className="h-3.5 w-3.5" /></button>
                    <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        {/* ===== WALLET ===== */}
        <TabsContent value="wallet" className="mt-4">
          <AdminWalletPanel />
        </TabsContent>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ToolbarRow({ placeholder, value, onChange, addLabel }: { placeholder: string; value: string; onChange: (v: string) => void; addLabel: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button variant="primary" size="sm" className="h-9 self-start">
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-9 pl-9 text-xs"
        />
      </div>
    </div>
  )
}
