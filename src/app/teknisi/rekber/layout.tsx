'use client'

import { TeknisiWorkspaceShell } from '@/components/dashboard/teknisi-workspace-shell'
import { DashboardServiceGate } from '@/components/dashboard/dashboard-service-gate'
import { canAccessRekberService } from '@/lib/platform-settings-shared'

export default function TeknisiRekberLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeknisiWorkspaceShell>
      <DashboardServiceGate
        canAccess={canAccessRekberService}
        title="Transaksi Aman"
        description="Layanan transaksi aman sedang dinonaktifkan oleh admin."
        dashboardHref="/teknisi/dashboard"
      >
        {children}
      </DashboardServiceGate>
    </TeknisiWorkspaceShell>
  )
}
