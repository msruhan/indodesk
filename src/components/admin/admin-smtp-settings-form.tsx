'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { SmtpSettingsDto } from '@/lib/smtp-settings'
import { AdminStepUpFields } from '@/components/admin/admin-step-up-fields'

export function AdminSmtpSettingsForm() {
  const [form, setForm] = useState<SmtpSettingsDto | null>(null)
  const [password, setPassword] = useState('')
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('')
  const [adminTotp, setAdminTotp] = useState('')
  const [adminTwoFa, setAdminTwoFa] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/platform/smtp')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat pengaturan SMTP')
        return
      }
      setForm(json.data)
      setPassword('')
    } catch {
      setError('Gagal memuat pengaturan SMTP')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    void fetch('/api/user/2fa')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAdminTwoFa(Boolean(json.data?.enabled))
      })
      .catch(() => {})
  }, [load])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/platform/smtp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: form.enabled,
          host: form.host,
          port: form.port,
          secure: form.secure,
          user: form.user,
          from: form.from,
          password: password.trim() || undefined,
          confirmPassword: adminTwoFa ? undefined : adminConfirmPassword || undefined,
          totp: adminTwoFa ? adminTotp || undefined : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan')
        return
      }
      setForm(json.data)
      setPassword('')
      setAdminConfirmPassword('')
      setAdminTotp('')
      setMessage('Pengaturan SMTP berhasil disimpan.')
    } catch {
      setError('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/platform/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal mengirim email uji')
        return
      }
      setMessage(`Email uji terkirim ke ${json.data.sentTo as string}.`)
    } catch {
      setError('Gagal mengirim email uji')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-surface-500">Memuat pengaturan SMTP…</p>
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
    <form className="space-y-4" onSubmit={(e) => void handleSave(e)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-surface-700">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((f) => f && { ...f, enabled: e.target.checked })}
            className="rounded border-surface-300"
          />
          Aktifkan SMTP
        </label>
        <Badge variant={form.enabled && form.host ? 'success' : 'outline'}>
          {form.enabled && form.host ? 'Siap kirim' : 'Belum dikonfigurasi'}
        </Badge>
      </div>

      <p className="text-xs text-surface-500">
        Dipakai untuk OTP penarikan saldo, reset password, verifikasi email, dan alert keamanan.
        Tanpa SMTP aktif, email dicatat ke log server saja.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Host SMTP</label>
          <Input
            value={form.host}
            onChange={(e) => setForm((f) => f && { ...f, host: e.target.value })}
            placeholder="smtp.gmail.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Port</label>
          <Input
            type="number"
            min={1}
            max={65535}
            value={form.port}
            onChange={(e) =>
              setForm((f) => f && { ...f, port: Number(e.target.value) || 587 })
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Username</label>
          <Input
            value={form.user}
            onChange={(e) => setForm((f) => f && { ...f, user: e.target.value })}
            placeholder="noreply@domain.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Password {form.hasPassword ? '(kosongkan jika tidak diubah)' : ''}
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={form.hasPassword ? form.passwordMasked : 'App password / SMTP pass'}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">From (email)</label>
          <Input
            type="email"
            value={form.from}
            onChange={(e) => setForm((f) => f && { ...f, from: e.target.value })}
            placeholder="noreply@indoteknizi.com"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-2 text-sm text-surface-700">
            <input
              type="checkbox"
              checked={form.secure}
              onChange={(e) => setForm((f) => f && { ...f, secure: e.target.checked })}
              className="rounded border-surface-300"
            />
            Koneksi TLS/SSL (port 465)
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-surface-200 bg-surface-50/50 p-3">
        <p className="mb-2 text-xs font-semibold text-ink">Uji koneksi</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Email tujuan (default: email admin login)"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            disabled={testing || saving}
            onClick={() => void handleTest()}
          >
            {testing ? 'Mengirim…' : 'Kirim email uji'}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-primary-700">{message}</p> : null}

      <AdminStepUpFields
        confirmPassword={adminConfirmPassword}
        totp={adminTotp}
        onConfirmPasswordChange={setAdminConfirmPassword}
        onTotpChange={setAdminTotp}
        twoFactorEnabled={adminTwoFa}
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={saving || testing}>
          {saving ? 'Menyimpan…' : 'Simpan SMTP'}
        </Button>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={saving || testing}>
          Muat ulang
        </Button>
      </div>
    </form>
  )
}
