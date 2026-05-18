import { Suspense } from 'react'
import { AdminImeiView } from '@/components/admin/admin-imei-view'

export const dynamic = 'force-dynamic'

export default function AdminImeiPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-surface-500">Memuat IMEI Service…</div>}>
      <AdminImeiView />
    </Suspense>
  )
}
