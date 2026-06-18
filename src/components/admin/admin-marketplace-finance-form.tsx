'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { computeMarketplaceFees } from '@/lib/marketplace-fees'
import { AdminStepUpFields } from '@/components/admin/admin-step-up-fields'

type FeeSettings = {
  buyerFeePercent: number
  sellerFeePercent: number
}

type Props = {
  initialSettings: FeeSettings | null
  onSaved?: () => void
}

export function AdminMarketplaceFinanceForm({ initialSettings, onSaved }: Props) {
  const [form, setForm] = useState<FeeSettings | null>(null)
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('')
  const [adminTotp, setAdminTotp] = useState('')
  const [adminTwoFa, setAdminTwoFa] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialSettings) {
      setForm(initialSettings)
    }
    void fetch('/api/user/2fa')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAdminTwoFa(Boolean(json.data?.enabled))
      })
      .catch(() => {})
  }, [initialSettings])

  const preview = useMemo(() => {
    if (!form) return null
    return computeMarketplaceFees(100_000, form)
  }, [form])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/marketplace-finance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
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
      setAdminConfirmPassword('')
      setAdminTotp('')
      setMessage('Pengaturan keuangan marketplace berhasil disimpan.')
      onSaved?.()
    } catch {
      setError('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return <p className="text-sm text-surface-500">Memuat pengaturan…</p>
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Fee Pembeli (%)
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.buyerFeePercent}
            onChange={(e) =>
              setForm((f) => f && { ...f, buyerFeePercent: Number(e.target.value) || 0 })
            }
          />
          <p className="mt-1 text-[11px] text-surface-500">
            Ditambahkan ke total checkout pembeli.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Fee Penjual (%)
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.sellerFeePercent}
            onChange={(e) =>
              setForm((f) => f && { ...f, sellerFeePercent: Number(e.target.value) || 0 })
            }
          />
          <p className="mt-1 text-[11px] text-surface-500">
            Dipotong dari hasil jual saat pesanan selesai.
          </p>
        </div>
      </div>

      {preview && (
        <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 text-xs text-surface-700">
          <p className="mb-2 font-semibold text-ink">Preview (order Rp 100.000)</p>
          <div className="space-y-1">
            <p>Pembeli di-hold: Rp {preview.buyerHold.toLocaleString('id-ID')}</p>
            <p>Teknisi terima: Rp {preview.sellerNet.toLocaleString('id-ID')}</p>
            <p>
              Platform: Rp {(preview.buyerFee + preview.sellerFee).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-primary-700">{message}</p> : null}
      <AdminStepUpFields
        confirmPassword={adminConfirmPassword}
        totp={adminTotp}
        onConfirmPasswordChange={setAdminConfirmPassword}
        onTotpChange={setAdminTotp}
        twoFactorEnabled={adminTwoFa}
      />
      <Button type="submit" disabled={saving}>
        {saving ? 'Menyimpan…' : 'Simpan Keuangan Marketplace'}
      </Button>
    </form>
  )
}
