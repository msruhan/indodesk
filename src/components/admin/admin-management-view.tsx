'use client'

import { useCallback, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminSaldoPanel } from '@/components/admin/admin-saldo-panel'
import { AdminUsersPanel } from '@/components/admin/admin-users-panel'
import { AdminTeknisiPanel } from '@/components/admin/admin-teknisi-panel'
import { AdminTokoPanel } from '@/components/admin/admin-toko-panel'

const TAB_KEYS = ['users', 'teknisi', 'toko', 'saldo'] as const
type TabKey = (typeof TAB_KEYS)[number]

export function AdminManagementView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const raw = searchParams.get('tab')
  // Backward-compat: tab=wallet → tab=saldo
  const normalized = raw === 'wallet' ? 'saldo' : raw
  const activeTab: TabKey = TAB_KEYS.includes(normalized as TabKey) ? (normalized as TabKey) : 'users'

  const setTab = useCallback(
    (v: string) => {
      const t = TAB_KEYS.includes(v as TabKey) ? v : 'users'
      router.replace(`${pathname}?tab=${t}`, { scroll: false })
    },
    [router, pathname],
  )

  useEffect(() => {
    if (raw === 'produk') {
      router.replace('/admin/produk')
    }
    if (raw === 'wallet') {
      router.replace(`${pathname}?tab=saldo`, { scroll: false })
    }
  }, [raw, router, pathname])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Management</h1>
        <p className="mt-0.5 text-[13px] text-surface-500">Pusat manajemen user, teknisi, toko, dan saldo platform.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setTab}>
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-10 w-max flex-nowrap gap-1">
            <TabsTrigger value="users" className="shrink-0 px-3 text-xs sm:px-4">Pengguna</TabsTrigger>
            <TabsTrigger value="teknisi" className="shrink-0 px-3 text-xs sm:px-4">Teknisi</TabsTrigger>
            <TabsTrigger value="toko" className="shrink-0 px-3 text-xs sm:px-4">Toko</TabsTrigger>
            <TabsTrigger value="saldo" className="shrink-0 px-3 text-xs sm:px-4">Saldo</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="mt-4">
          <AdminUsersPanel />
        </TabsContent>

        <TabsContent value="teknisi" className="mt-4">
          <AdminTeknisiPanel />
        </TabsContent>

        <TabsContent value="toko" className="mt-4">
          <AdminTokoPanel />
        </TabsContent>

        <TabsContent value="saldo" className="mt-4">
          <AdminSaldoPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
