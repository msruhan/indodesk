'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { TeknisiSidebar } from '@/components/dashboard/teknisi-sidebar'
import { DashboardHeader } from '@/components/dashboard'
import { DashboardPeriodProvider } from '@/contexts/dashboard-period-context'
import { useSidebar } from '@/contexts/sidebar-context'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import { cn } from '@/lib/utils'
import { DashboardBottomNav, DashboardMobileSpacer } from '@/components/mobile/dashboard-bottom-nav'
import {
  getTeknisiLayananSectionTabs,
  isTeknisiLayananZone,
} from '@/lib/teknisi-layanan-nav'

export function TeknisiWorkspaceShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  const pathname = usePathname()
  const { flags } = useFeatureFlags()
  const layananTabs = useMemo(() => getTeknisiLayananSectionTabs(flags), [flags])
  const showLayananTabs = isTeknisiLayananZone(pathname)

  return (
    <DashboardPeriodProvider>
      <div className="min-h-screen bg-surface-50">
        <TeknisiSidebar />
        <div
          className={cn(
            'transition-all duration-300',
            isCollapsed ? 'pl-0' : 'pl-0 lg:pl-64',
          )}
        >
          <DashboardHeader mobileSectionTabs={showLayananTabs ? layananTabs : undefined} />
          <main className="overflow-x-hidden p-3 sm:p-6">{children}</main>
        </div>
        <DashboardMobileSpacer />
        <DashboardBottomNav />
      </div>
    </DashboardPeriodProvider>
  )
}
