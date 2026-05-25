'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { InspectionTeknisiOption } from '@/lib/inspection-serializer'
import { getInspectionBasePrice } from '@/lib/inspection-pricing'
import type { InspectionDeviceCategory, InspectionMode } from '@prisma/client'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

type Props = {
  productPrefill?: {
    productId?: string
    productName?: string
    category?: InspectionDeviceCategory
    teknisiId?: string
    productSource?: 'INDOTEKNIZII'
  }
  fixedTeknisiId?: string
  initialMode?: InspectionMode
  lockMode?: boolean
  onSuccess?: (orderId: string) => void
  /** Modal / inline — tanpa Card wrapper tebal */
  embedded?: boolean
}

export function InspectionCreateForm({
  productPrefill,
  fixedTeknisiId,
  initialMode: initialModeProp,
  lockMode = false,
  onSuccess,
  embedded = false,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [teknisiList, setTeknisiList] = useState<InspectionTeknisiOption[]>([])
  const [loadingTeknisi, setLoadingTeknisi] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [mode, setMode] = useState<InspectionMode>(initialModeProp ?? 'ONLINE')
  const [category, setCategory] = useState<InspectionDeviceCategory>(
    productPrefill?.category ?? 'HANDPHONE',
  )
  const [teknisiId, setTeknisiId] = useState(
    fixedTeknisiId ?? productPrefill?.teknisiId ?? '',
  )
  const [productName, setProductName] = useState(
    productPrefill?.productName ?? searchParams.get('productName') ?? '',
  )
  const [productSource, setProductSource] = useState(
    productPrefill?.productSource ?? 'OTHER',
  )
  const [productSourceUrl, setProductSourceUrl] = useState('')
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')

  const productId = productPrefill?.productId ?? searchParams.get('productId') ?? undefined

  useEffect(() => {
    if (initialModeProp) setMode(initialModeProp)
  }, [initialModeProp])

  useEffect(() => {
    if (fixedTeknisiId) setTeknisiId(fixedTeknisiId)
  }, [fixedTeknisiId])

  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat === 'HANDPHONE' || cat === 'LAPTOP') setCategory(cat)
    const tid = searchParams.get('teknisiId')
    if (tid && !fixedTeknisiId) setTeknisiId(tid)
    const m = searchParams.get('mode')
    if (m === 'ONLINE' || m === 'OFFLINE') setMode(m)
    const src = searchParams.get('productSource')
    if (
      src === 'INDOTEKNIZII' ||
      src === 'TOKOPEDIA' ||
      src === 'SHOPEE' ||
      src === 'OLX' ||
      src === 'FACEBOOK_MARKETPLACE' ||
      src === 'PRIVATE' ||
      src === 'OTHER'
    ) {
      setProductSource(src)
    }
    const listingUrl = searchParams.get('productSourceUrl')
    if (listingUrl) setProductSourceUrl(listingUrl)
  }, [searchParams, fixedTeknisiId])

  useEffect(() => {
    if (fixedTeknisiId) {
      setLoadingTeknisi(false)
      return
    }
    void fetch('/api/inspeksi/teknisi')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTeknisiList(d.data)
      })
      .finally(() => setLoadingTeknisi(false))
  }, [fixedTeknisiId])

  const price = useMemo(() => getInspectionBasePrice(mode, category), [mode, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!teknisiId) {
      setError('Pilih teknisi')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/user/inspeksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teknisiId,
          mode,
          category,
          productId,
          productName,
          productSource,
          productSourceUrl,
          notes,
          location,
          city,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Gagal membuat permintaan')
        return
      }
      if (onSuccess) {
        onSuccess(data.data.id)
        return
      }
      router.push(`/user/inspeksi/${data.data.id}`)
    } catch {
      setError('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jenis inspeksi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['ONLINE', 'OFFLINE'] as const).map((m) => (
              <button
                key={m}
                type="button"
                disabled={lockMode}
                onClick={() => !lockMode && setMode(m)}
                className={`rounded-full border px-4 py-2 text-xs font-medium ${
                  mode === m
                    ? 'border-primary-500 bg-primary-50 text-primary-800'
                    : 'border-surface-200 text-surface-600'
                } ${lockMode ? 'cursor-default opacity-90' : ''}`}
              >
                {m === 'ONLINE' ? 'Online (dipandu)' : 'Offline (datang lokasi)'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['HANDPHONE', 'LAPTOP'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full border px-4 py-2 text-xs font-medium ${
                  category === c
                    ? 'border-primary-500 bg-primary-50 text-primary-800'
                    : 'border-surface-200 text-surface-600'
                }`}
              >
                {c === 'HANDPHONE' ? 'Handphone' : 'Laptop'}
              </button>
            ))}
          </div>
          <p className="text-sm font-semibold text-primary-700">Estimasi biaya: {formatPrice(price)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail barang</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-surface-600">Nama produk *</label>
            <Input value={productName} onChange={(e) => setProductName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600">Sumber barang</label>
            <select
              value={productSource}
              onChange={(e) => setProductSource(e.target.value)}
              className="h-10 w-full rounded-xl border border-surface-200 px-3 text-sm"
              disabled={!!productPrefill?.productSource}
            >
              <option value="INDOTEKNIZII">Marketplace IndoTeknizi</option>
              <option value="TOKOPEDIA">Tokopedia</option>
              <option value="SHOPEE">Shopee</option>
              <option value="OLX">OLX</option>
              <option value="FACEBOOK_MARKETPLACE">Facebook Marketplace</option>
              <option value="PRIVATE">Penjual pribadi</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600">Link listing</label>
            <Input
              value={productSourceUrl}
              onChange={(e) => setProductSourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          {mode === 'OFFLINE' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-600">Kota</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-surface-600">Alamat lokasi *</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required={mode === 'OFFLINE'}
                />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-surface-600">Catatan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {!fixedTeknisiId && (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilih teknisi *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loadingTeknisi ? (
            <p className="text-sm text-surface-500">Memuat teknisi...</p>
          ) : (
            teknisiList.map((t) => {
              const p =
                mode === 'ONLINE'
                  ? category === 'HANDPHONE'
                    ? t.priceOnlineHandphone
                    : t.priceOnlineLaptop
                  : category === 'HANDPHONE'
                    ? t.priceOfflineHandphone
                    : t.priceOfflineLaptop
              return (
                <label
                  key={t.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                    teknisiId === t.id ? 'border-primary-400 bg-primary-50/50' : 'border-surface-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="teknisi"
                    value={t.id}
                    checked={teknisiId === t.id}
                    onChange={() => setTeknisiId(t.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-surface-500">
                      {t.location ?? '—'} · ⭐ {t.rating.toFixed(1)} ({t.reviewCount})
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary-700">{formatPrice(p)}</span>
                </label>
              )
            })
          )}
        </CardContent>
      </Card>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
        {submitting ? 'Memproses pembayaran…' : `Bayar & kirim permintaan (${formatPrice(price)})`}
      </Button>
    </form>
  )
}
