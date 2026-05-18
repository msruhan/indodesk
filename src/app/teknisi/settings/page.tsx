import { Suspense } from 'react'
import { TeknisiAkunView } from '@/components/teknisi/teknisi-akun-view'

export default function TeknisiSettingsPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface-100" aria-hidden />}>
      <TeknisiAkunView />
    </Suspense>
  )
}
