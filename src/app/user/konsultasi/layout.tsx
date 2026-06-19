'use client'

import { DashboardServiceGate } from '@/components/dashboard/dashboard-service-gate'
import { canAccessKonsultasiService } from '@/lib/platform-settings-shared'

export default function UserKonsultasiLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardServiceGate
      canAccess={canAccessKonsultasiService}
      title="Konsultasi"
      description="Layanan konsultasi teknisi sedang dinonaktifkan oleh admin."
      dashboardHref="/user/dashboard"
    >
      {children}
    </DashboardServiceGate>
  )
}
