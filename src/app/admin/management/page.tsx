import { Suspense } from 'react'
import { AdminManagementView } from '@/components/admin/admin-management-view'

export const dynamic = 'force-dynamic'

export default function AdminManagementPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-surface-500">Memuat management…</div>}>
      <AdminManagementView />
    </Suspense>
  )
}
