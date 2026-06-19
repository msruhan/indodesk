import { Suspense } from 'react'
import { AdminComplaintsView } from '@/components/admin/admin-complaints-view'

export const metadata = {
  title: 'Komplain · Admin Bantoo',
  description: 'Tinjau dan selesaikan komplain marketplace dan transaksi aman.',
}

export default function AdminKomplainPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <Suspense fallback={<div className="text-sm text-surface-500">Memuat komplain…</div>}>
        <AdminComplaintsView />
      </Suspense>
    </div>
  )
}
