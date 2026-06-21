'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { PlatformSettingsDto } from '@/lib/platform-settings-shared'
import {
  fetchAdminTwoFactorEnabled,
  requestAdminStepUpCredentials,
} from '@/lib/admin-step-up-client'
import { cn } from '@/lib/utils'
import { Clock, Sparkles } from '@/lib/icons'

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function AdminComingSoonForm() {
  const [settings, setSettings] = useState<PlatformSettingsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const launchPreview = useMemo(() => {
    if (!settings?.comingSoonLaunchAt) return null
    const d = new Date(settings.comingSoonLaunchAt)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [settings?.comingSoonLaunchAt])

  const handleSave = async () => {
    if (!settings) return
    const twoFa = await fetchAdminTwoFactorEnabled()
    const stepUp = await requestAdminStepUpCredentials(twoFa)
    if (!stepUp) return

    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/platform/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, ...stepUp }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan')
        return
      }
      setSettings(json.data)
      setMessage(
        json.data.comingSoonEnabled
          ? 'Mode Coming Soon aktif — pengunjung diarahkan ke halaman soft launch.'
          : 'Mode Coming Soon dimatikan — situs kembali normal.',
      )
    } catch {
      setError('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (enabled: boolean) => {
    if (!settings) return
    setSettings({ ...settings, comingSoonEnabled: enabled })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-2xl bg-surface-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-surface-100" />
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
    <div className="space-y-5">
      <div
        className={cn(
          'flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-start sm:justify-between',
          settings.comingSoonEnabled
            ? 'border-primary-200/80 bg-gradient-to-br from-primary-50/80 to-white'
            : 'border-surface-200/70 bg-white/80',
        )}
      >
        <div className="flex gap-3">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              settings.comingSoonEnabled
                ? 'bg-primary-100 text-primary-700'
                : 'bg-surface-100 text-surface-500',
            )}
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-ink">Mode Coming Soon</p>
              <Badge variant={settings.comingSoonEnabled ? 'success' : 'outline'}>
                {settings.comingSoonEnabled ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-surface-600">
              Saat diaktifkan, seluruh halaman publik diarahkan ke{' '}
              <code className="rounded bg-surface-100 px-1 py-0.5 text-[11px]">/coming-soon</code>.
              Pendaftaran user &amp; teknisi tetap dibuka; login dashboard hanya untuk admin.
            </p>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-surface-500">
              Jika terlogout saat mode aktif, buka{' '}
              <Link href="/login?callbackUrl=/admin/visibility" className="font-medium text-primary-700 hover:underline">
                /login
              </Link>
              , login sebagai admin, lalu matikan toggle di halaman ini.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={settings.comingSoonEnabled}
          aria-label="Aktifkan mode Coming Soon"
          disabled={saving}
          onClick={() => void handleToggle(!settings.comingSoonEnabled)}
          className={cn(
            'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300',
            settings.comingSoonEnabled ? 'bg-primary-600' : 'bg-surface-300',
            saving && 'cursor-not-allowed opacity-60',
          )}
        >
          <span
            className={cn(
              'inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300',
              settings.comingSoonEnabled ? 'translate-x-5' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-surface-700">
            <Sparkles className="h-4 w-4 text-primary-600" />
            Judul halaman
          </label>
          <Input
            value={settings.comingSoonHeadline}
            onChange={(e) =>
              setSettings((s) => s && { ...s, comingSoonHeadline: e.target.value })
            }
            placeholder="Sesuatu yang Besar Segera Hadir"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-surface-700">Pesan</label>
          <textarea
            value={settings.comingSoonMessage}
            onChange={(e) =>
              setSettings((s) => s && { ...s, comingSoonMessage: e.target.value })
            }
            rows={3}
            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none ring-primary-500/20 transition focus:border-primary-300 focus:ring-2"
            placeholder="Ceritakan sedikit tentang peluncuran yang akan datang…"
          />
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-surface-700">
            <Clock className="h-4 w-4 text-primary-600" />
            Target peluncuran (countdown)
          </label>
          <Input
            type="datetime-local"
            value={toDatetimeLocalValue(settings.comingSoonLaunchAt)}
            onChange={(e) =>
              setSettings(
                (s) => s && { ...s, comingSoonLaunchAt: fromDatetimeLocalValue(e.target.value) },
              )
            }
          />
          {launchPreview ? (
            <p className="mt-1.5 text-xs text-surface-500">Tampil: {launchPreview}</p>
          ) : (
            <p className="mt-1.5 text-xs text-surface-500">
              Opsional — kosongkan jika belum ada tanggal pasti.
            </p>
          )}
        </div>

        <div className="flex items-end">
          <a
            href="/coming-soon"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-xl border border-surface-200 bg-white px-4 text-sm font-medium text-surface-700 transition hover:border-primary-200 hover:text-primary-700"
          >
            Pratinjau halaman →
          </a>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-primary-700">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Menyimpan…' : 'Simpan Coming Soon'}
        </Button>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={saving}>
          Muat ulang
        </Button>
      </div>
    </div>
  )
}
