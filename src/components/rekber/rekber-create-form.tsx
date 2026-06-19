'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { calculateRekberFee } from '@/lib/rekber-config'
import type { RekberSellerOption, RekberSellerPreview } from '@/lib/rekber-seller-types'
import { cn } from '@/lib/utils'
import { AlertCircle, Store, Users } from '@/lib/icons'
import { RekberSellerPicker } from '@/components/rekber/rekber-seller-picker'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

type SellerMode = 'peer' | 'directory'

type Props = {
  onSuccess?: () => void
  onCancel?: () => void
}

export function RekberCreateForm({ onSuccess, onCancel }: Props) {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [mode, setMode] = useState<SellerMode>('peer')
  const [sellers, setSellers] = useState<RekberSellerOption[]>([])
  const [sellersLoading, setSellersLoading] = useState(false)
  const [sellerSearch, setSellerSearch] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [sellerEmail, setSellerEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sellerPreview, setSellerPreview] = useState<RekberSellerPreview | null>(null)
  const [sellerPreviewLoading, setSellerPreviewLoading] = useState(false)

  useEffect(() => {
    if (mode !== 'directory' || sessionStatus !== 'authenticated') {
      setSellers([])
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setSellersLoading(true)
      const params = sellerSearch.trim() ? new URLSearchParams({ q: sellerSearch.trim() }) : ''
      void fetch(`/api/rekber/sellers${params ? `?${params}` : ''}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          const json = await res.json()
          if (!res.ok || !json.success) {
            setSellers([])
            return
          }
          setSellers(json.data as RekberSellerOption[])
        })
        .catch(() => {
          if (!controller.signal.aborted) setSellers([])
        })
        .finally(() => {
          if (!controller.signal.aborted) setSellersLoading(false)
        })
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [mode, sellerSearch, sessionStatus])

  useEffect(() => {
    const emailTrimmed = sellerEmail.trim().toLowerCase()
    const hasSeller = mode === 'directory' ? Boolean(sellerId) : emailTrimmed.includes('@')

    if (!hasSeller || sessionStatus !== 'authenticated') {
      setSellerPreview(null)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setSellerPreviewLoading(true)
      const params = new URLSearchParams(
        mode === 'directory' ? { sellerId } : { sellerEmail: emailTrimmed },
      )
      void fetch(`/api/rekber/check-seller?${params}`, { signal: controller.signal })
        .then(async (res) => {
          const json = await res.json()
          if (!res.ok || !json.success) {
            setSellerPreview(null)
            return
          }
          setSellerPreview(json.data as RekberSellerPreview)
        })
        .catch(() => {
          if (!controller.signal.aborted) setSellerPreview(null)
        })
        .finally(() => {
          if (!controller.signal.aborted) setSellerPreviewLoading(false)
        })
    }, 400)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [mode, sellerId, sellerEmail, sessionStatus])

  const amountNum = parseInt(amount, 10) || 0
  const fee = amountNum > 0 ? calculateRekberFee(amountNum) : 0
  const total = amountNum + fee
  const isAuthed = sessionStatus === 'authenticated'
  const isSessionLoading = sessionStatus === 'loading'
  const loginHref = `/login?callbackUrl=${encodeURIComponent('/rekber')}`

  const handleModeChange = (next: SellerMode) => {
    setMode(next)
    setSellerId('')
    setSellerEmail('')
    setSellerSearch('')
    setSellerPreview(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailTrimmed = sellerEmail.trim().toLowerCase()
    const hasSeller = mode === 'directory' ? Boolean(sellerId) : Boolean(emailTrimmed)

    if (!hasSeller || amountNum < 10000) {
      setError(
        mode === 'directory'
          ? 'Pilih penjual dan nominal minimal Rp 10.000'
          : 'Isi email penjual terdaftar dan nominal minimal Rp 10.000',
      )
      return
    }

    if (mode === 'peer' && session?.user?.email?.toLowerCase() === emailTrimmed) {
      setError('Tidak dapat membuat rekber dengan diri sendiri sebagai penjual')
      return
    }

    if (sessionStatus !== 'authenticated') {
      router.push(loginHref)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const body =
        mode === 'directory'
          ? { sellerId, amount: amountNum, description: description.trim() }
          : { sellerEmail: emailTrimmed, amount: amountNum, description: description.trim() }

      const res = await fetch('/api/rekber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal membuat rekber')
        return
      }
      if (onSuccess) {
        onSuccess()
        return
      }
      const role = session?.user?.role
      router.push(role === 'USER' ? '/user/rekber' : '/rekber')
    } catch {
      setError('Gagal membuat rekber')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Ajukan Rekber Aman</CardTitle>
        <p className="text-sm text-surface-600">
          Untuk transaksi di luar listing marketplace — nego langsung, jasa custom, atau jual beli antar member.
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
            <span>
              Barang sudah dijual resmi di{' '}
              <Link href="/marketplace" className="font-semibold underline underline-offset-2">
                Marketplace
              </Link>
              ? Gunakan checkout di sana — escrow otomatis, tanpa form rekber manual.
            </span>
          </p>
        </div>

        <div className="mb-4 flex gap-2 rounded-xl bg-surface-100 p-1">
          <button
            type="button"
            onClick={() => handleModeChange('peer')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
              mode === 'peer'
                ? 'bg-white text-ink shadow-soft-xs'
                : 'text-surface-600 hover:text-ink',
            )}
          >
            <Users className="h-4 w-4" />
            Transaksi bebas
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('directory')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
              mode === 'directory'
                ? 'bg-white text-ink shadow-soft-xs'
                : 'text-surface-600 hover:text-ink',
            )}
          >
            <Store className="h-4 w-4" />
            Pilih penjual
          </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          {mode === 'peer' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-surface-700">
                Email penjual (akun Bantoo)
              </label>
              <Input
                type="email"
                value={sellerEmail}
                onChange={(e) => setSellerEmail(e.target.value)}
                placeholder="penjual@email.com"
                required
                autoComplete="email"
              />
              <p className="mt-1 text-[11px] text-surface-500">
                Penjual harus sudah terdaftar. Cocok jika Anda tahu email penjual langsung.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="mb-1 block text-sm font-medium text-surface-700">
                Penjual terdaftar
              </label>
              {!isSessionLoading && !isAuthed ? (
                <div className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-3 text-sm text-primary-950">
                  <p className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                    <span>
                      <span className="font-semibold">Masuk diperlukan.</span> Daftar member dan
                      teknisi hanya tampil setelah Anda masuk ke akun Bantoo.
                    </span>
                  </p>
                  <Link href={loginHref} className="mt-3 inline-block">
                    <Button type="button" size="sm" variant="primary">
                      Masuk / Daftar
                    </Button>
                  </Link>
                </div>
              ) : (
                <RekberSellerPicker
                  value={sellerId}
                  onChange={setSellerId}
                  sellers={sellers}
                  search={sellerSearch}
                  onSearchChange={setSellerSearch}
                  loading={sellersLoading || isSessionLoading}
                  disabled={!isAuthed || isSessionLoading}
                />
              )}
              <p className="text-[11px] text-surface-500">
                Daftar member dan teknisi terdaftar di Bantoo — untuk deal di luar checkout marketplace.
              </p>
            </div>
          )}

          {sellerPreviewLoading && (
            <p className="text-[11px] text-surface-500">Memeriksa listing marketplace penjual…</p>
          )}

          {sellerPreview && sellerPreview.activeListingCount > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
              <p className="font-semibold">
                Penjual punya {sellerPreview.activeListingCount} produk aktif di Marketplace
              </p>
              <p className="mt-1">
                Jika barang yang Anda beli sudah terdaftar di sana, gunakan checkout Marketplace untuk
                escrow otomatis dan perlindungan lebih lengkap.
              </p>
              <ul className="mt-2 space-y-1">
                {sellerPreview.listings.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/marketplace/${item.id}`}
                      className="font-medium underline underline-offset-2"
                    >
                      {item.name}
                    </Link>
                    <span className="text-amber-900/80"> — {formatPrice(item.price)}</span>
                  </li>
                ))}
              </ul>
              {sellerPreview.activeListingCount > sellerPreview.listings.length && (
                <Link
                  href="/marketplace"
                  className="mt-2 inline-block font-semibold underline underline-offset-2"
                >
                  Lihat semua di Marketplace
                </Link>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Nominal transaksi (Rp)</label>
            <Input
              type="number"
              min={10000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000000"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-surface-200/80 px-3 py-2 text-sm"
              rows={3}
              placeholder="Jelaskan barang/layanan yang dibeli…"
              required
              minLength={5}
            />
          </div>

          {amountNum > 0 && (
            <div className="rounded-xl bg-surface-50 px-3 py-2 text-xs text-surface-600">
              <p>Nominal: {formatPrice(amountNum)}</p>
              <p>Biaya rekber: {formatPrice(fee)}</p>
              <p className="font-semibold text-ink">Total ditahan: {formatPrice(total)}</p>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            {!isSessionLoading && !isAuthed ? (
              <Link href={loginHref}>
                <Button type="button" variant="primary">
                  Masuk untuk melanjutkan
                </Button>
              </Link>
            ) : (
              <Button type="submit" variant="primary" disabled={submitting || isSessionLoading}>
                {submitting ? 'Membuat…' : 'Buat Rekber'}
              </Button>
            )}
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Batal
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
