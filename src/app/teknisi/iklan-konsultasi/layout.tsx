'use client'

import type { ReactNode } from 'react'
import { TeknisiWorkspaceShell } from '@/components/dashboard/teknisi-workspace-shell'
import { DashboardServiceGate } from '@/components/dashboard/dashboard-service-gate'
import { canAccessKonsultasiService } from '@/lib/platform-settings-shared'

export default function TeknisiIklanKonsultasiLayout({ children }: { children: ReactNode }) {
  return (
    <TeknisiWorkspaceShell>
      <DashboardServiceGate
        canAccess={canAccessKonsultasiService}
        title="Iklan Konsultasi"
        description="Pengelolaan paket konsultasi sedang dinonaktifkan oleh admin."
        dashboardHref="/teknisi/dashboard"
      >
        {children}
      </DashboardServiceGate>
    </TeknisiWorkspaceShell>
  )
}
