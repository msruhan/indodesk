'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { User, Wrench } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { PlatformSettingsDto } from '@/lib/platform-settings-shared'
import {
  fetchAdminTwoFactorEnabled,
  requestAdminStepUpCredentials,
} from '@/lib/admin-step-up-client'

type RegistrationFlagKey = 'userRegistrationEnabled' | 'teknisiRegistrationEnabled'

type RegistrationFlag = {
  key: RegistrationFlagKey
  title: string
  description: string
  icon: typeof User
}

const FLAGS: RegistrationFlag[] = [
  {
    key: 'userRegistrationEnabled',
    title: 'Pendaftaran User',
    description:
      'Izinkan pengunjung mendaftar akun user baru via formulir atau Google. Bila dimatikan, halaman /register menampilkan pesan penutupan sementara.',
    icon: User,
  },
  {
    key: 'teknisiRegistrationEnabled',
    title: 'Pendaftaran Teknisi',
    description:
      'Izinkan calon teknisi mendaftar via formulir atau Google. Bila dimatikan, halaman /register/teknisi menampilkan pesan penutupan sementara.',
    icon: Wrench,
  },
]

export function AdminRegistrationControlForm() {
  const [settings, setSettings] = useState<PlatformSettingsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<RegistrationFlagKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/platform/settings')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat pengaturan')
        return
      }
      setSettings(json.data)
    } catch {
      setError('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const toggle = async (flag: RegistrationFlag, next: boolean) => {
    if (!settings) return
    const twoFa = await fetchAdminTwoFactorEnabled()
    const stepUp = await requestAdminStepUpCredentials(twoFa)
    if (!stepUp) return

    setSaving(flag.key)
    setError(null)
    setMessage(null)
    const optimistic = { ...settings, [flag.key]: next }
    setSettings(optimistic)
    try {
      const res = await fetch('/api/admin/platform/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...optimistic, ...stepUp }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan')
        setSettings(settings)
        return
      }
      setSettings(json.data)
      const action = next ? 'dibuka' : 'ditutup'
      setMessage(`${flag.title} berhasil ${action}.`)
    } catch {
      setError('Gagal menyimpan')
      setSettings(settings)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-surface-100" />
        <div className="h-24 animate-pulse rounded-xl bg-surface-100" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-rose-600">{error ?? 'Pengaturan tidak tersedia.'}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          Coba lagi
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {FLAGS.map((flag) => {
        const Icon = flag.icon
        const enabled = settings[flag.key]
        const isSaving = saving === flag.key

        return (
          <div
            key={flag.key}
            className="flex flex-col gap-3 rounded-2xl border border-surface-200/70 bg-white/80 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex gap-3">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{flag.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-surface-500">{flag.description}</p>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-surface-400">
                  {enabled ? 'Pendaftaran dibuka' : 'Pendaftaran ditutup sementara'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                  enabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900',
                )}
              >
                {enabled ? 'Aktif' : 'Tutup'}
              </span>
              <Button
                type="button"
                variant={enabled ? 'outline' : 'primary'}
                size="sm"
                disabled={isSaving}
                onClick={() => void toggle(flag, !enabled)}
              >
                {isSaving ? 'Menyimpan…' : enabled ? 'Tutup pendaftaran' : 'Buka pendaftaran'}
              </Button>
            </div>
          </div>
        )
      })}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
    </div>
  )
}
