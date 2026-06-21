'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle } from '@/lib/icons'
import { AdminStepUpFields } from '@/components/admin/admin-step-up-fields'

type ContactFields = {
  email: string
  phone: string
}

type HelpSupportContactPayload = {
  user: ContactFields
  teknisi: ContactFields
  globalFallback: ContactFields
  effective: {
    user: ContactFields
    teknisi: ContactFields
  }
}

const emptyContact = (): ContactFields => ({ email: '', phone: '' })

function ContactFieldsForm({
  title,
  hint,
  value,
  onChange,
  effective,
}: {
  title: string
  hint: string
  value: ContactFields
  onChange: (next: ContactFields) => void
  effective: ContactFields
}) {
  return (
    <div className="space-y-3 rounded-xl border border-surface-200/70 bg-surface-50/40 p-4">
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-surface-500">{hint}</p>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-surface-700">Email Support</span>
        <Input
          type="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          placeholder={effective.email || 'hello@bantoo.in'}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-surface-700">Telepon / WhatsApp</span>
        <Input
          type="tel"
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          placeholder={effective.phone || '08xxxxxxxxxx'}
        />
      </label>
      <p className="text-[11px] text-surface-500">
        Ditampilkan ke pengguna:{' '}
        <span className="font-medium text-surface-700">{effective.email || '—'}</span>
        {' · '}
        <span className="font-medium text-surface-700">{effective.phone || '—'}</span>
      </p>
    </div>
  )
}

export function AdminHelpSupportContactPanel() {
  const [form, setForm] = useState<HelpSupportContactPayload | null>(null)
  const [user, setUser] = useState<ContactFields>(emptyContact())
  const [teknisi, setTeknisi] = useState<ContactFields>(emptyContact())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [adminTwoFa, setAdminTwoFa] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/help/contact', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat kontak support')
        return
      }
      const data = json.data as HelpSupportContactPayload
      setForm(data)
      setUser(data.user)
      setTeknisi(data.teknisi)
    } catch {
      setError('Gagal memuat kontak support')
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

  const previewEffective = {
    user: {
      email: user.email.trim() || form?.globalFallback.email || '',
      phone: user.phone.trim() || form?.globalFallback.phone || '',
    },
    teknisi: {
      email: teknisi.email.trim() || form?.globalFallback.email || '',
      phone: teknisi.phone.trim() || form?.globalFallback.phone || '',
    },
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/help/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user,
          teknisi,
          confirmPassword: adminTwoFa ? undefined : confirmPassword || undefined,
          totp: adminTwoFa ? totp || undefined : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan kontak support')
        return
      }
      const data = json.data as HelpSupportContactPayload
      setForm(data)
      setUser(data.user)
      setTeknisi(data.teknisi)
      setConfirmPassword('')
      setTotp('')
      setMessage('Kontak support berhasil disimpan.')
    } catch {
      setError('Gagal menyimpan kontak support')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-5 w-5" />
          Kontak Support
        </CardTitle>
        <p className="text-sm text-surface-500">
          Atur email dan telepon yang muncul di tab Kontak Pusat Bantuan user dan teknisi. Kosongkan
          field untuk memakai fallback global (
          {form?.globalFallback.email ?? '—'} · {form?.globalFallback.phone ?? '—'}).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-surface-500">Memuat kontak support…</p>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <ContactFieldsForm
                title="Dashboard User"
                hint="Tab Kontak di /user/bantuan"
                value={user}
                onChange={setUser}
                effective={previewEffective.user}
              />
              <ContactFieldsForm
                title="Dashboard Teknisi"
                hint="Tab Kontak di /teknisi/bantuan"
                value={teknisi}
                onChange={setTeknisi}
                effective={previewEffective.teknisi}
              />
            </div>

            <AdminStepUpFields
              twoFactorEnabled={adminTwoFa}
              confirmPassword={confirmPassword}
              totp={totp}
              onConfirmPasswordChange={setConfirmPassword}
              onTotpChange={setTotp}
            />

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="primary" onClick={() => void save()} disabled={saving}>
                {saving ? 'Menyimpan…' : 'Simpan Kontak Support'}
              </Button>
              <Button type="button" variant="outline" onClick={() => void load()} disabled={loading || saving}>
                Muat ulang
              </Button>
            </div>

            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
