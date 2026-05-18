import { Suspense } from 'react'
import { TeknisiSaldoView } from '@/components/teknisi/teknisi-saldo-view'

export const dynamic = 'force-dynamic'

export default function TeknisiSaldoPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-surface-500">Memuat saldo...</div>}>
      <TeknisiSaldoView />
    </Suspense>
  )
}
