'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Smartphone, Laptop, CheckSquare } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { PlatformSettingsDto } from '@/lib/platform-settings-shared'
import {
  fetchAdminTwoFactorEnabled,
  requestAdminStepUpCredentials,
} from '@/lib/admin-step-up-client'

type FlagKey = 'imeiServiceEnabled' | 'remoteServiceEnabled' | 'inspectionServiceEnabled'

type FeatureFlag = {
  key: FlagKey
  title: string
  description: string
  icon: typeof Smartphone
  /** Catatan akses kontekstual yang ditampilkan di kartu. */
  audienceNote: string
}

const FLAGS: FeatureFlag[] = [
  {
    key: 'imeiServiceEnabled',
    title: 'Menu Layanan Digital',
    description:
      'Tampilkan menu "Layanan Digital" di navigasi publik dan halaman /imei untuk teknisi terdaftar. Admin selalu memiliki akses ke panel admin terkait. User biasa & pengunjung tidak melihat menu ini.',
    icon: Smartphone,
    audienceNote: 'Navigasi publik · Teknisi · Admin',
  },
  {
    key: 'remoteServiceEnabled',
    title: 'Halaman IndoDesk & Konsultasi Remote',
    description:
      'Tampilkan halaman publik /remote (panduan IndoDesk) dan izinkan pemesanan konsultasi dengan remote (requiresRemote). Sesi remote dikelola di menu Konsultasi — bukan menu terpisah. Bila dimatikan, link navigasi disembunyikan dan booking remote diblokir.',
    icon: Laptop,
    audienceNote: 'Navigasi publik · Booking konsultasi remote',
  },
  {
    key: 'inspectionServiceEnabled',
    title: 'Menu Inspeksi Pra-Beli',
    description:
      'Tampilkan menu Inspeksi di navigasi publik, sidebar user/teknisi, dan halaman layanan terkait. Bila dimatikan, halaman publik dan dashboard user tidak bisa diakses; link disembunyikan. Admin selalu memiliki akses panel admin.',
    icon: CheckSquare,
    audienceNote: 'Navigasi publik · Dashboard user/teknisi · Admin',
  },
]

export function AdminFeatureFlagsForm() {
  const [settings, setSettings] = useState<PlatformSettingsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<FlagKey | null>(null)
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

  const toggle = async (flag: FeatureFlag, next: boolean) => {
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
        // rollback
        setSettings(settings)
        return
      }
      setSettings(json.data)
      setMessage(
        `${flag.title} berhasil ${next ? 'diaktifkan' : 'dinonaktifkan'}.`,
      )
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
                  enabled ? 'bg-primary-50 text-primary-700' : 'bg-surface-100 text-surface-500',
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{flag.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-surface-500">
                  {flag.description}
                </p>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-surface-400">
                  {flag.audienceNote}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                  enabled
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-surface-100 text-surface-500',
                )}
              >
                {enabled ? 'Aktif' : 'Disembunyikan'}
              </span>
              <FlagSwitch
                checked={enabled}
                disabled={isSaving}
                onChange={(next) => void toggle(flag, next)}
                label={flag.title}
              />
            </div>
          </div>
        )
      })}
      {message ? <p className="text-xs text-primary-700">{message}</p> : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  )
}

function FlagSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300',
        checked ? 'bg-primary-600' : 'bg-surface-300',
        disabled && 'opacity-60 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
