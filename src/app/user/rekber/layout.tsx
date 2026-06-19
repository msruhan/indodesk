'use client'

import { DashboardServiceGate } from '@/components/dashboard/dashboard-service-gate'
import { canAccessRekberService } from '@/lib/platform-settings-shared'

export default function UserRekberLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardServiceGate
      canAccess={canAccessRekberService}
      title="Transaksi Aman"
      description="Layanan transaksi aman sedang dinonaktifkan oleh admin."
      dashboardHref="/user/dashboard"
    >
      {children}
    </DashboardServiceGate>
  )
}
