'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminServicesProdukPanel } from '@/components/admin/admin-services-produk-panel'
import { AdminServicesTopupPanel } from '@/components/admin/admin-services-topup-panel'
import { AdminServicesRemotePanel } from '@/components/admin/admin-services-remote-panel'

const TAB_KEYS = ['produk', 'topup', 'remote'] as const
type TabKey = (typeof TAB_KEYS)[number]

export function AdminServicesView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const raw = searchParams.get('tab')
  const activeTab: TabKey = TAB_KEYS.includes(raw as TabKey) ? (raw as TabKey) : 'produk'

  const setTab = useCallback(
    (v: string) => {
      const t = TAB_KEYS.includes(v as TabKey) ? v : 'produk'
      router.replace(`${pathname}?tab=${t}`, { scroll: false })
    },
    [router, pathname],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Services</h1>
        <p className="mt-0.5 text-[13px] text-surface-500">
          Kelola produk marketplace, topup digital, dan layanan remote.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setTab}>
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-10 w-max flex-nowrap gap-1">
            <TabsTrigger value="produk" className="shrink-0 px-3 text-xs sm:px-4">
              Manajemen Produk
            </TabsTrigger>
            <TabsTrigger value="topup" className="shrink-0 px-3 text-xs sm:px-4">
              Manajemen Topup
            </TabsTrigger>
            <TabsTrigger value="remote" className="shrink-0 px-3 text-xs sm:px-4">
              Remote
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="produk" className="mt-4">
          <AdminServicesProdukPanel />
        </TabsContent>

        <TabsContent value="topup" className="mt-4">
          <AdminServicesTopupPanel />
        </TabsContent>

        <TabsContent value="remote" className="mt-4">
          <AdminServicesRemotePanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/** @deprecated Use AdminServicesView */
export const AdminProdukView = AdminServicesView
