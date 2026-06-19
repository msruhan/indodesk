'use client'

import { TeknisiWorkspaceShell } from '@/components/dashboard/teknisi-workspace-shell'
import { DashboardServiceGate } from '@/components/dashboard/dashboard-service-gate'
import { canAccessKonsultasiService } from '@/lib/platform-settings-shared'

export default function TeknisiKonsultasiLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeknisiWorkspaceShell>
      <DashboardServiceGate
        canAccess={canAccessKonsultasiService}
        title="Konsultasi"
        description="Layanan konsultasi sedang dinonaktifkan oleh admin."
        dashboardHref="/teknisi/dashboard"
      >
        {children}
      </DashboardServiceGate>
    </TeknisiWorkspaceShell>
  )
}
