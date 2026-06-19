'use client'

import { TeknisiWorkspaceShell } from '@/components/dashboard/teknisi-workspace-shell'
import { DashboardServiceGate } from '@/components/dashboard/dashboard-service-gate'
import { canAccessInspectionService } from '@/lib/platform-settings-shared'

export default function TeknisiInspeksiLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeknisiWorkspaceShell>
      <DashboardServiceGate
        canAccess={canAccessInspectionService}
        title="Inspeksi"
        description="Layanan inspeksi pra-beli sedang dinonaktifkan oleh admin."
        dashboardHref="/teknisi/dashboard"
      >
        {children}
      </DashboardServiceGate>
    </TeknisiWorkspaceShell>
  )
}
