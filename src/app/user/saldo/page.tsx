import { Suspense } from 'react'
import { UserSaldoView } from '@/components/user/user-saldo-view'

export const dynamic = 'force-dynamic'

export default function UserSaldoPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-surface-500">Memuat saldo...</div>}>
      <UserSaldoView />
    </Suspense>
  )
}
