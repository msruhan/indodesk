'use client'

import { AccountSettingsView } from '@/components/account/account-settings-view'

export default function UserAkunPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink">Akun Saya</h1>
        <p className="mt-1 text-sm text-surface-500">Kelola profil, keamanan, dan preferensi akun Anda.</p>
      </div>
      <AccountSettingsView />
    </div>
  )
}
