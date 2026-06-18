'use client'

import { Suspense } from 'react'
import { AccountSettingsView } from '@/components/account/account-settings-view'

export default function UserAkunPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink">Profil</h1>
        <p className="mt-1 text-sm text-surface-500">Kelola profil, keamanan, dan preferensi akun Anda.</p>
      </div>
      <Suspense fallback={<div className="p-6 text-sm text-surface-500">Memuat akun…</div>}>
        <AccountSettingsView />
      </Suspense>
    </div>
  )
}
