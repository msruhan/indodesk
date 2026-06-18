'use client'

import { useCallback, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardPageHeader } from '@/components/dashboard'
import { AdminMarketplaceComplaintsPanel } from '@/components/admin/admin-marketplace-complaints-panel'
import { AdminRekberComplaintsPanel } from '@/components/admin/admin-rekber-complaints-panel'

const TAB_KEYS = ['marketplace', 'rekber'] as const
type TabKey = (typeof TAB_KEYS)[number]

export function AdminComplaintsView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const raw = searchParams.get('tab')
  const activeTab: TabKey = TAB_KEYS.includes(raw as TabKey) ? (raw as TabKey) : 'marketplace'

  const setTab = useCallback(
    (v: string) => {
      const t = TAB_KEYS.includes(v as TabKey) ? v : 'marketplace'
      router.replace(`${pathname}?tab=${t}`, { scroll: false })
    },
    [router, pathname],
  )

  useEffect(() => {
    if (raw === 'marketplace' || raw === 'rekber') return
    if (!raw) {
      router.replace(`${pathname}?tab=marketplace`, { scroll: false })
    }
  }, [raw, router, pathname])

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        eyebrow="Operasional"
        title="Komplain"
        description="Tinjau dan selesaikan komplain marketplace serta rekber dari satu tempat."
      />

      <Tabs value={activeTab} onValueChange={setTab}>
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-10 w-max flex-nowrap gap-1">
            <TabsTrigger value="marketplace" className="shrink-0 px-3 text-xs sm:px-4">
              Komplain Marketplace
            </TabsTrigger>
            <TabsTrigger value="rekber" className="shrink-0 px-3 text-xs sm:px-4">
              Komplain Rekber
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="marketplace" className="mt-4">
          <AdminMarketplaceComplaintsPanel embedded />
        </TabsContent>

        <TabsContent value="rekber" className="mt-4">
          <AdminRekberComplaintsPanel embedded />
        </TabsContent>
      </Tabs>
    </div>
  )
}
