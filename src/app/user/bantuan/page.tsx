import { Suspense } from 'react'
import { PusatBantuanPage } from '@/components/help/pusat-bantuan-page'

export default function UserBantuanPage() {
  return (
    <Suspense fallback={<p className="text-sm text-surface-500">Memuat…</p>}>
      <PusatBantuanPage audience="user" />
    </Suspense>
  )
}
