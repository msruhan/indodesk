'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PlatformSettingsDto } from '@/lib/platform-settings-shared'

export function AdminPlatformSettingsForm() {
  const [form, setForm] = useState<PlatformSettingsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      setForm(json.data)
    } catch {
      setError('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/platform/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan')
        return
      }
      setForm(json.data)
      setMessage('Pengaturan berhasil disimpan.')
    } catch {
      setError('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-surface-500">Memuat pengaturan…</p>
  }

  if (error && !form) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-rose-600">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          Coba lagi
        </Button>
      </div>
    )
  }

  if (!form) return null

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Nama Platform</label>
          <Input
            value={form.platformName}
            onChange={(e) => setForm((f) => f && { ...f, platformName: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Email Admin</label>
          <Input
            type="email"
            value={form.adminEmail}
            onChange={(e) => setForm((f) => f && { ...f, adminEmail: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Email Support</label>
          <Input
            type="email"
            value={form.supportEmail}
            onChange={(e) => setForm((f) => f && { ...f, supportEmail: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Telepon Support</label>
          <Input
            value={form.supportPhone}
            onChange={(e) => setForm((f) => f && { ...f, supportPhone: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Fee Platform (%)</label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.feePercent}
            onChange={(e) =>
              setForm((f) => f && { ...f, feePercent: Number(e.target.value) || 0 })
            }
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-surface-700">
        <input
          type="checkbox"
          checked={form.maintenanceMode}
          onChange={(e) => setForm((f) => f && { ...f, maintenanceMode: e.target.checked })}
          className="rounded border-surface-300"
        />
        Mode maintenance (tampilkan peringatan ke pengunjung)
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-primary-700">{message}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
        </Button>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={saving}>
          Muat ulang
        </Button>
      </div>
    </form>
  )
}