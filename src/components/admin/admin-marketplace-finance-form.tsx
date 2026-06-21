'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  computeMarketplaceFees,
  formatSellerFeeTierRange,
  normalizeSellerFeeTiers,
  sampleItemPriceForTier,
  validateSellerFeeTiers,
} from '@/lib/marketplace-fees'
import { previewServiceFees } from '@/lib/service-platform-fees'
import type { SellerFeeTier } from '@/lib/platform-settings-shared'
import { AdminStepUpFields } from '@/components/admin/admin-step-up-fields'

type FeeSettings = {
  buyerFeePercent: number
  buyerFlatFeePerItem: number
  sellerFeePercent: number
  sellerFeeTiers: SellerFeeTier[]
  konsultasiFeePercent: number
  inspeksiFeePercent: number
}

type EditableTier = SellerFeeTier & { clientId: string }

type Props = {
  initialSettings: FeeSettings | null
  onSaved?: () => void
}

function newTierId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `tier-${Date.now()}-${Math.random()}`
}

function toEditableTiers(tiers: SellerFeeTier[]): EditableTier[] {
  return tiers.map((tier) => ({ ...tier, clientId: newTierId() }))
}

function syncEditableTierFromDraft(
  tier: EditableTier,
  draft: { minAmount: string; maxAmount: string; feePercent: string } | undefined,
): EditableTier {
  if (!draft) return tier
  return {
    ...tier,
    minAmount: parseRequiredInt(draft.minAmount, tier.minAmount),
    maxAmount: parseOptionalInt(draft.maxAmount),
    feePercent: parsePercent(draft.feePercent, tier.feePercent),
  }
}

function parseOptionalInt(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed.replace(/\./g, '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? Math.floor(parsed) : null
}

function parseRequiredInt(raw: string, fallback = 0): number {
  return parseOptionalInt(raw) ?? fallback
}

function parsePercent(raw: string, fallback = 0): number {
  const trimmed = raw.trim().replace(',', '.')
  if (!trimmed) return fallback
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : fallback
}

const numericInputClass =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

export function AdminMarketplaceFinanceForm({ initialSettings, onSaved }: Props) {
  const [form, setForm] = useState<FeeSettings | null>(null)
  const [editableTiers, setEditableTiers] = useState<EditableTier[]>([])
  const [tierDrafts, setTierDrafts] = useState<
    Record<string, { minAmount: string; maxAmount: string; feePercent: string }>
  >({})
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('')
  const [adminTotp, setAdminTotp] = useState('')
  const [adminTwoFa, setAdminTwoFa] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialSettings) {
      const tiers = normalizeSellerFeeTiers(initialSettings.sellerFeeTiers ?? [])
      const editable = toEditableTiers(tiers)
      setForm({
        ...initialSettings,
        sellerFeeTiers: tiers,
      })
      setEditableTiers(editable)
      setTierDrafts(
        Object.fromEntries(
          editable.map((tier) => [
            tier.clientId,
            {
              minAmount: String(tier.minAmount),
              maxAmount: tier.maxAmount == null ? '' : String(tier.maxAmount),
              feePercent: String(tier.feePercent),
            },
          ]),
        ),
      )
    }
    void fetch('/api/user/2fa')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAdminTwoFa(Boolean(json.data?.enabled))
      })
      .catch(() => {})
  }, [initialSettings])

  const tierSettings = useMemo(
    () =>
      form
        ? {
            ...form,
            sellerFeeTiers: editableTiers.map((tier) => {
              const draft = tierDrafts[tier.clientId]
              return {
                minAmount: draft ? parseRequiredInt(draft.minAmount, tier.minAmount) : tier.minAmount,
                maxAmount: draft ? parseOptionalInt(draft.maxAmount) : tier.maxAmount,
                feePercent: draft ? parsePercent(draft.feePercent, tier.feePercent) : tier.feePercent,
              }
            }),
          }
        : null,
    [form, editableTiers, tierDrafts],
  )

  const usesTieredSellerFee = editableTiers.length > 0

  const marketplacePreviewSmall = useMemo(() => {
    if (!tierSettings) return null
    return computeMarketplaceFees(100_000, tierSettings, 1)
  }, [tierSettings])

  const tierRangePreviews = useMemo(() => {
    if (!tierSettings) return []
    return tierSettings.sellerFeeTiers.map((tier) => {
      const samplePrice = sampleItemPriceForTier(tier)
      const breakdown = computeMarketplaceFees(samplePrice, tierSettings, 1)
      return { tier, samplePrice, breakdown }
    })
  }, [tierSettings])

  const servicePreview = useMemo(() => {
    if (!form) return null
    return previewServiceFees(100_000, form)
  }, [form])

  const updateTierDraft = (
    clientId: string,
    patch: Partial<{ minAmount: string; maxAmount: string; feePercent: string }>,
  ) => {
    setTierDrafts((current) => ({
      ...current,
      [clientId]: { ...current[clientId], ...patch },
    }))
  }

  const addTier = () => {
    if (!form) return
    const synced = editableTiers.map((tier) =>
      syncEditableTierFromDraft(tier, tierDrafts[tier.clientId]),
    )

    let nextTier: SellerFeeTier
    if (synced.length === 0) {
      nextTier = { minAmount: 0, maxAmount: 100_000, feePercent: form.sellerFeePercent }
    } else {
      const last = synced[synced.length - 1]
      const nextMin = (last?.maxAmount ?? last?.minAmount ?? 0) + 1
      if (last?.maxAmount == null) {
        const cappedMax = Math.max(last.minAmount, nextMin - 1)
        synced[synced.length - 1] = { ...last, maxAmount: cappedMax }
      }
      nextTier = {
        minAmount: nextMin,
        maxAmount: null,
        feePercent: form.sellerFeePercent,
      }
    }

    const clientId = newTierId()
    const nextEditable = [...synced, { ...nextTier, clientId }]
    setEditableTiers(nextEditable)
    setTierDrafts((current) => {
      const next = { ...current }
      if (synced.length > 0) {
        const lastSynced = synced[synced.length - 1]
        if (lastSynced.maxAmount != null) {
          next[lastSynced.clientId] = {
            ...next[lastSynced.clientId],
            maxAmount: String(lastSynced.maxAmount),
          }
        }
      }
      next[clientId] = {
        minAmount: String(nextTier.minAmount),
        maxAmount: nextTier.maxAmount == null ? '' : String(nextTier.maxAmount),
        feePercent: String(nextTier.feePercent),
      }
      return next
    })
  }

  const removeTier = (clientId: string) => {
    setEditableTiers((current) => current.filter((tier) => tier.clientId !== clientId))
    setTierDrafts((current) => {
      const next = { ...current }
      delete next[clientId]
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form || !tierSettings) return

    const sellerFeeTiers = normalizeSellerFeeTiers(tierSettings.sellerFeeTiers)
    const tierError = validateSellerFeeTiers(sellerFeeTiers)
    if (tierError) {
      setError(tierError)
      return
    }

    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/marketplace-finance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sellerFeeTiers,
          confirmPassword: adminTwoFa ? undefined : adminConfirmPassword || undefined,
          totp: adminTwoFa ? adminTotp || undefined : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan')
        return
      }
      const savedTiers = normalizeSellerFeeTiers(json.data.sellerFeeTiers ?? [])
      const editable = toEditableTiers(savedTiers)
      setForm({
        ...json.data,
        sellerFeeTiers: savedTiers,
      })
      setEditableTiers(editable)
      setTierDrafts(
        Object.fromEntries(
          editable.map((tier) => [
            tier.clientId,
            {
              minAmount: String(tier.minAmount),
              maxAmount: tier.maxAmount == null ? '' : String(tier.maxAmount),
              feePercent: String(tier.feePercent),
            },
          ]),
        ),
      )
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
            masing-masing komponen. Fee penjual dihitung per item berdasarkan harga item, dipotong saat
            pesanan selesai.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Fee Pembeli (%)
            </label>
            <Input
              type="text"
              inputMode="decimal"
              className={numericInputClass}
              value={String(form.buyerFeePercent)}
              onChange={(e) =>
                setForm((f) => f && { ...f, buyerFeePercent: parsePercent(e.target.value) })
              }
            />
            <p className="mt-1 text-[11px] text-surface-500">0 = nonaktif</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Biaya Layanan per Item (Rp)
            </label>
            <Input
              type="text"
              inputMode="numeric"
              className={numericInputClass}
              value={String(form.buyerFlatFeePerItem)}
              onChange={(e) =>
                setForm((f) =>
                  f && { ...f, buyerFlatFeePerItem: parseRequiredInt(e.target.value) },
                )
              }
            />
            <p className="mt-1 text-[11px] text-surface-500">Dikenakan per kuantitas item</p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-surface-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Fee Penjual (per item)</p>
              <p className="mt-0.5 text-[11px] text-surface-500">
                Atur tarif flat atau rentang harga per item. Contoh: Rp 0–100.000 = 1%, Rp 100.001–1.000.000
                = 2%.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addTier}>
              Tambah tier
            </Button>
          </div>

          {!usesTieredSellerFee ? (
            <div className="max-w-xs">
              <label className="mb-1 block text-sm font-medium text-surface-700">
                Tarif flat (%)
              </label>
              <Input
                type="text"
                inputMode="decimal"
                className={numericInputClass}
                value={String(form.sellerFeePercent)}
                onChange={(e) =>
                  setForm((f) => f && { ...f, sellerFeePercent: parsePercent(e.target.value) })
                }
              />
              <p className="mt-1 text-[11px] text-surface-500">
                Klik &quot;Tambah tier&quot; untuk rentang harga per item (mis. 0–100.000 = 1%).
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {editableTiers.map((tier, index) => {
                const draft = tierDrafts[tier.clientId] ?? {
                  minAmount: String(tier.minAmount),
                  maxAmount: tier.maxAmount == null ? '' : String(tier.maxAmount),
                  feePercent: String(tier.feePercent),
                }
                const parsedTier = {
                  minAmount: parseRequiredInt(draft.minAmount, tier.minAmount),
                  maxAmount: parseOptionalInt(draft.maxAmount),
                  feePercent: parsePercent(draft.feePercent, tier.feePercent),
                }

                return (
                  <div
                    key={tier.clientId}
                    className="grid gap-2 rounded-lg border border-surface-200 bg-surface-50/70 p-3 sm:grid-cols-[1fr_1fr_120px_auto]"
                  >
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-surface-600">
                        Harga min (Rp)
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        className={numericInputClass}
                        disabled={index === 0}
                        value={draft.minAmount}
                        onChange={(e) =>
                          updateTierDraft(tier.clientId, { minAmount: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-surface-600">
                        Harga maks (Rp)
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        className={numericInputClass}
                        placeholder="Kosong = tak terbatas"
                        value={draft.maxAmount}
                        onChange={(e) =>
                          updateTierDraft(tier.clientId, { maxAmount: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-surface-600">
                        Fee (%)
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className={numericInputClass}
                        value={draft.feePercent}
                        onChange={(e) =>
                          updateTierDraft(tier.clientId, { feePercent: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={editableTiers.length <= 1}
                        onClick={() => removeTier(tier.clientId)}
                      >
                        Hapus
                      </Button>
                    </div>
                    <p className="sm:col-span-4 text-[10px] text-surface-500">
                      Rentang: {formatSellerFeeTierRange(parsedTier)}
                    </p>
                  </div>
                )
              })}
              <p className="text-[11px] text-surface-500">
                Fee dihitung per kuantitas item menurut harga satuan item. Hapus semua tier untuk
                kembali ke tarif flat.
              </p>
            </div>
          )}
        </div>

        {marketplacePreviewSmall && (
          <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 text-xs text-surface-700">
            <p className="mb-2 font-semibold text-ink">
              Preview marketplace (1 item Rp 100.000)
            </p>
            <div className="space-y-1">
              {marketplacePreviewSmall.buyerFeePercentPart > 0 && (
                <p>
                  Fee pembeli (%): Rp{' '}
                  {marketplacePreviewSmall.buyerFeePercentPart.toLocaleString('id-ID')}
                </p>
              )}
              {marketplacePreviewSmall.buyerFlatFeePart > 0 && (
                <p>
                  Biaya layanan (1 item): Rp{' '}
                  {marketplacePreviewSmall.buyerFlatFeePart.toLocaleString('id-ID')}
                </p>
              )}
              <p>
                Fee penjual per item ({marketplacePreviewSmall.sellerFeePercentApplied}%): Rp{' '}
                {marketplacePreviewSmall.sellerFee.toLocaleString('id-ID')}
              </p>
              <p>
                Pembeli di-hold: Rp {marketplacePreviewSmall.buyerHold.toLocaleString('id-ID')}
              </p>
              <p>Teknisi terima: Rp {marketplacePreviewSmall.sellerNet.toLocaleString('id-ID')}</p>
              <p>
                Platform: Rp{' '}
                {(marketplacePreviewSmall.buyerFee + marketplacePreviewSmall.sellerFee).toLocaleString(
                  'id-ID',
                )}
              </p>
            </div>
          </div>
        )}

        {usesTieredSellerFee && tierRangePreviews.length > 0 && (
          <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-4 text-xs text-surface-700">
            <p className="mb-2 font-semibold text-ink">Preview per rentang fee penjual (1 item)</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tierRangePreviews.map(({ tier, samplePrice, breakdown }, index) => (
                <div
                  key={`tier-preview-${index}`}
                  className="rounded-lg border border-primary-100/80 bg-white/70 p-3"
                >
                  <p className="font-medium text-ink">Rentang {formatSellerFeeTierRange(tier)}</p>
                  <p className="mt-1 text-[11px] text-surface-500">
                    Contoh item Rp {samplePrice.toLocaleString('id-ID')} · fee {breakdown.sellerFeePercentApplied}%
                  </p>
                  <p className="mt-2">
                    Fee penjual: Rp {breakdown.sellerFee.toLocaleString('id-ID')}
                  </p>
                  <p>Teknisi terima: Rp {breakdown.sellerNet.toLocaleString('id-ID')}</p>
                </div>
              ))}
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
              type="text"
              inputMode="decimal"
              className={numericInputClass}
              value={String(form.konsultasiFeePercent)}
              onChange={(e) =>
                setForm((f) => f && { ...f, konsultasiFeePercent: parsePercent(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Fee Inspeksi (%)
            </label>
            <Input
              type="text"
              inputMode="decimal"
              className={numericInputClass}
              value={String(form.inspeksiFeePercent)}
              onChange={(e) =>
                setForm((f) => f && { ...f, inspeksiFeePercent: parsePercent(e.target.value) })
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
