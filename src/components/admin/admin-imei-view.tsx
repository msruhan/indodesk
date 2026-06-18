'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminImeiApiPanel } from '@/components/admin/admin-imei-api-panel'
import { AdminImeiGroupsPanel } from '@/components/admin/admin-imei-groups-panel'
import { AdminImeiServicesPanel } from '@/components/admin/admin-imei-services-panel'
import { AdminImeiOrdersPanel } from '@/components/admin/admin-imei-orders-panel'
import { AdminServerServicesPanel } from '@/components/admin/admin-server-services-panel'
import { AdminServerOrdersPanel } from '@/components/admin/admin-server-orders-panel'

const TAB_KEYS = ['api-manager', 'groups', 'services', 'orders', 'server-services', 'server-orders'] as const
type TabKey = (typeof TAB_KEYS)[number]

export function AdminImeiView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const raw = searchParams.get('tab')
  const activeTab: TabKey = TAB_KEYS.includes(raw as TabKey) ? (raw as TabKey) : 'api-manager'

  const setTab = useCallback(
    (v: string) => {
      const t = TAB_KEYS.includes(v as TabKey) ? v : 'api-manager'
      router.replace(`${pathname}?tab=${t}`, { scroll: false })
    },
    [router, pathname],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Digital & Server Service</h1>
        <p className="mt-0.5 text-[13px] text-surface-500">
          Kelola API supplier, layanan digital, server service, dan order masuk.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setTab}>
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-10 w-max flex-nowrap gap-1">
            <TabsTrigger value="api-manager" className="shrink-0 px-3 text-xs sm:px-4">
              API Manager
            </TabsTrigger>
            <TabsTrigger value="groups" className="shrink-0 px-3 text-xs sm:px-4">
              Digital Groups
            </TabsTrigger>
            <TabsTrigger value="services" className="shrink-0 px-3 text-xs sm:px-4">
              Digital Services
            </TabsTrigger>
            <TabsTrigger value="orders" className="shrink-0 px-3 text-xs sm:px-4">
              Digital Orders
            </TabsTrigger>
            <TabsTrigger value="server-services" className="shrink-0 px-3 text-xs sm:px-4">
              Server Services
            </TabsTrigger>
            <TabsTrigger value="server-orders" className="shrink-0 px-3 text-xs sm:px-4">
              Server Orders
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="api-manager" className="mt-4">
          <AdminImeiApiPanel />
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <AdminImeiGroupsPanel />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <AdminImeiServicesPanel />
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <AdminImeiOrdersPanel />
        </TabsContent>

        <TabsContent value="server-services" className="mt-4">
          <AdminServerServicesPanel />
        </TabsContent>

        <TabsContent value="server-orders" className="mt-4">
          <AdminServerOrdersPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
