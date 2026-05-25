'use client'

import { Suspense } from 'react'
import { ImeiOrdersView } from '@/components/imei/imei-orders-view'

export default function UserImeiOrdersPage() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-surface-500">Memuat riwayat order…</p>
      }
    >
      <ImeiOrdersView />
    </Suspense>
  )
}
