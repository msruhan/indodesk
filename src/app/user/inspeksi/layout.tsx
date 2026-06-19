'use client'

import { DashboardServiceGate } from '@/components/dashboard/dashboard-service-gate'
import { canAccessInspectionService } from '@/lib/platform-settings-shared'

export default function UserInspeksiLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardServiceGate
      canAccess={canAccessInspectionService}
      title="Inspeksi"
      description="Layanan inspeksi pra-beli sedang dinonaktifkan oleh admin."
      dashboardHref="/user/dashboard"
    >
      {children}
    </DashboardServiceGate>
  )
}
