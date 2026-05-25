'use client'

import { useState } from 'react'
import { Shield } from '@/lib/icons'
import { cn } from '@/lib/utils'

type Props = {
  userId: string
  userName: string
  apiPath: string
  twoFactorEnabled: boolean
  hasPendingSetup?: boolean
  onSuccess?: () => void
  className?: string
}

export function AdminReset2FaButton({
  userId,
  userName,
  apiPath,
  twoFactorEnabled,
  hasPendingSetup = false,
  onSuccess,
  className,
}: Props) {
  const [loading, setLoading] = useState(false)

  const show = twoFactorEnabled || hasPendingSetup
  if (!show) return null

  const reset = async () => {
    const label = twoFactorEnabled ? '2FA aktif' : 'setup 2FA belum selesai'
    const msg = `Reset 2FA untuk "${userName}"?\n\nStatus: ${label}.\n\nUser/teknisi bisa login tanpa kode authenticator dan harus mengaktifkan 2FA baru jika diperlukan.`
    if (!confirm(msg)) return

    setLoading(true)
    try {
      const res = await fetch(apiPath, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal reset 2FA')
      onSuccess?.()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal reset 2FA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      title="Reset / nonaktifkan 2FA"
      disabled={loading}
      onClick={() => void reset()}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50 disabled:opacity-50',
        className,
      )}
      aria-label={`Reset 2FA ${userName}`}
    >
      <Shield className="h-3.5 w-3.5" />
    </button>
  )
}
