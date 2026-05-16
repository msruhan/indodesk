import { Suspense } from 'react'
import { AdminServicesView } from '@/components/admin/admin-services-view'

export default function AdminProdukPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-surface-500">Memuat services…</div>}>
      <AdminServicesView />
    </Suspense>
  )
}
