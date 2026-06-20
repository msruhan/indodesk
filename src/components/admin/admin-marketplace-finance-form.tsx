'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { computeMarketplaceFees } from '@/lib/marketplace-fees'
import { previewServiceFees } from '@/lib/service-platform-fees'
import { AdminStepUpFields } from '@/components/admin/admin-step-up-fields'

type FeeSettings = {
  buyerFeePercent: number
  buyerFlatFeePerItem: number
  sellerFeePercent: number
  konsultasiFeePercent: number
  inspeksiFeePercent: number
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

  const marketplacePreview = useMemo(() => {
    if (!form) return null
    return computeMarketplaceFees(100_000, form, 2)
  }, [form])

  const servicePreview = useMemo(() => {
    if (!form) return null
    return previewServiceFees(100_000, form)
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
      setMessage('Pengaturan fee platform berhasil disimpan.')
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
    <form className="space-y-8" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-ink">Marketplace</h4>
          <p className="mt-0.5 text-[11px] text-surface-500">
            Fee pembeli (% dan/atau flat per item) ditambahkan ke checkout. Isi 0 untuk menonaktifkan
            masing-masing komponen. Fee penjual dipotong saat pesanan selesai.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
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
            <p className="mt-1 text-[11px] text-surface-500">0 = nonaktif</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Biaya Layanan per Item (Rp)
            </label>
            <Input
              type="number"
              min={0}
              max={1000000}
              step={100}
              value={form.buyerFlatFeePerItem}
              onChange={(e) =>
                setForm((f) => f && { ...f, buyerFlatFeePerItem: Number(e.target.value) || 0 })
              }
            />
            <p className="mt-1 text-[11px] text-surface-500">Dikenakan per kuantitas item</p>
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
          </div>
        </div>
        {marketplacePreview && (
          <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 text-xs text-surface-700">
            <p className="mb-2 font-semibold text-ink">
              Preview marketplace (order Rp 100.000, 2 item)
            </p>
            <div className="space-y-1">
              {marketplacePreview.buyerFeePercentPart > 0 && (
                <p>
                  Fee pembeli (%): Rp{' '}
                  {marketplacePreview.buyerFeePercentPart.toLocaleString('id-ID')}
                </p>
              )}
              {marketplacePreview.buyerFlatFeePart > 0 && (
                <p>
                  Biaya layanan (2 item): Rp{' '}
                  {marketplacePreview.buyerFlatFeePart.toLocaleString('id-ID')}
                </p>
              )}
              <p>
                Pembeli di-hold: Rp {marketplacePreview.buyerHold.toLocaleString('id-ID')}
              </p>
              <p>Teknisi terima: Rp {marketplacePreview.sellerNet.toLocaleString('id-ID')}</p>
              <p>
                Platform: Rp{' '}
                {(marketplacePreview.buyerFee + marketplacePreview.sellerFee).toLocaleString(
                  'id-ID',
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-surface-200 pt-6">
        <div>
          <h4 className="text-sm font-semibold text-ink">Konsultasi & Inspeksi</h4>
          <p className="mt-0.5 text-[11px] text-surface-500">
            Fee dipotong dari harga layanan saat dicairkan ke teknisi. User membayar harga penuh.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Fee Konsultasi (%)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.konsultasiFeePercent}
              onChange={(e) =>
                setForm((f) => f && { ...f, konsultasiFeePercent: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Fee Inspeksi (%)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.inspeksiFeePercent}
              onChange={(e) =>
                setForm((f) => f && { ...f, inspeksiFeePercent: Number(e.target.value) || 0 })
              }
            />
          </div>
        </div>
        {servicePreview && (
          <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 text-xs text-surface-700">
            <p className="mb-2 font-semibold text-ink">Preview layanan (harga Rp 100.000)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-medium text-ink">Konsultasi</p>
                <p>Teknisi terima: Rp {servicePreview.konsultasi.teknisiEarning.toLocaleString('id-ID')}</p>
                <p>Platform: Rp {servicePreview.konsultasi.platformFee.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="font-medium text-ink">Inspeksi</p>
                <p>Teknisi terima: Rp {servicePreview.inspeksi.teknisiEarning.toLocaleString('id-ID')}</p>
                <p>Platform: Rp {servicePreview.inspeksi.platformFee.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        )}
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
      <Button type="submit" disabled={saving}>
        {saving ? 'Menyimpan…' : 'Simpan Pengaturan Fee'}
      </Button>
    </form>
  )
}
