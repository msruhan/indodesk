import { Suspense } from 'react'
import { AdminSupportTicketsPanel } from '@/components/admin/admin-support-tickets-panel'

export default function AdminTicketsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-surface-500">Memuat…</p>}>
      <AdminSupportTicketsPanel />
    </Suspense>
  )
}
