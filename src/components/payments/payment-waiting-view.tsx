'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import type { PaymentIntentDto } from '@/lib/payments/payment-intent'
import { saldoPathForRole } from '@/lib/role-routes'
import type { UserRole } from '@prisma/client'
import { CheckCircle2, Clock, Copy, XCircle } from '@/lib/icons'
import { cn } from '@/lib/utils'

type PaymentWaitingViewProps = {
  merchantRef: string
}

function formatIdr(value: string | number) {
  const num = typeof value === 'string' ? Number(value) : value
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

function useCountdown(expiredAt: string | null) {
  const [remaining, setRemaining] = useState<string>('—')

  useEffect(() => {
    if (!expiredAt) return
    const tick = () => {
      const diff = new Date(expiredAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining('Kedaluwarsa')
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${h}j ${m}m ${s}d`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiredAt])

  return remaining
}

export function PaymentWaitingView({ merchantRef }: PaymentWaitingViewProps) {
  const router = useRouter()
  const { user } = useAuth()
  const saldoPath = useMemo(
    () => saldoPathForRole((user?.role as UserRole) ?? 'USER'),
    [user?.role],
  )
  const [intent, setIntent] = useState<PaymentIntentDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const countdown = useCountdown(intent?.expiredAt ?? null)
  const isKonsultasi = intent?.purpose === 'KONSULTASI'
  const isMarketplace = intent?.purpose === 'MARKETPLACE'
  const isCatalogTopup = intent?.purpose === 'CATALOG_TOPUP'
  const backPath = isKonsultasi
    ? '/user/konsultasi'
    : isMarketplace
      ? '/user/orders'
      : isCatalogTopup
        ? intent?.orderCode
          ? `/topup/order/${intent.orderCode}`
          : '/topup'
        : saldoPath
  const backLabel = isKonsultasi
    ? 'Kembali ke Konsultasi'
    : isMarketplace
      ? 'Kembali ke Pesanan'
      : isCatalogTopup
        ? 'Kembali ke Order Top Up'
        : 'Kembali ke Saldo'
  const successPath = isKonsultasi
    ? '/user/konsultasi?paid=success'
    : isMarketplace
      ? '/user/orders?paid=success'
      : isCatalogTopup && intent?.orderCode
        ? `/topup/order/${intent.orderCode}`
        : isCatalogTopup
          ? '/user/orders?tab=topup'
          : `${saldoPath}?topup=success`
  const subtotalLabel = isKonsultasi
    ? 'Biaya konsultasi'
    : isMarketplace
      ? 'Total pesanan'
      : isCatalogTopup
        ? 'Total top up'
        : 'Nominal topup'

  const fetchStatus = useCallback(async () => {
    const res = await fetch(`/api/payments/tripay/${merchantRef}`)
    const data = await res.json()
    if (!data.success) {
      setError(data.error || 'Gagal memuat pembayaran')
      setLoading(false)
      return null
    }
    setIntent(data.data)
    setLoading(false)
    return data.data as PaymentIntentDto
  }, [merchantRef])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (!intent || intent.status !== 'UNPAID') return
    const id = setInterval(async () => {
      const latest = await fetchStatus()
      if (latest?.status === 'PAID') {
        clearInterval(id)
      }
    }, 5000)
    return () => clearInterval(id)
  }, [intent, fetchStatus])

  useEffect(() => {
    if (intent?.status === 'PAID') {
      const t = setTimeout(() => router.push(successPath), 2500)
      return () => clearTimeout(t)
    }
  }, [intent?.status, router, successPath])

  const copyPayCode = async () => {
    if (!intent?.payCode) return
    await navigator.clipboard.writeText(intent.payCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !intent) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <p className="mt-4 text-sm text-surface-600">{error || 'Pembayaran tidak ditemukan'}</p>
        <Button asChild className="mt-6" variant="outline">
          <Link href={backPath}>{backLabel}</Link>
        </Button>
      </div>
    )
  }

  if (intent.status === 'PAID') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-4 text-xl font-semibold text-ink">Pembayaran berhasil</h1>
        <p className="mt-2 text-sm text-surface-600">
          {isKonsultasi
            ? `Pembayaran ${formatIdr(intent.subtotal)} berhasil. Mengalihkan ke halaman konsultasi…`
            : isMarketplace
              ? `Pembayaran ${formatIdr(intent.subtotal)} berhasil. Mengalihkan ke pesanan…`
              : isCatalogTopup
                ? `Pembayaran ${formatIdr(intent.subtotal)} berhasil. Mengalihkan ke order top up…`
                : `Saldo ${formatIdr(intent.subtotal)} telah ditambahkan. Mengalihkan ke halaman saldo…`}
        </p>
      </div>
    )
  }

  if (intent.status === 'EXPIRED' || intent.status === 'FAILED') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <XCircle className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-xl font-semibold text-ink">Pembayaran {intent.status === 'EXPIRED' ? 'kedaluwarsa' : 'gagal'}</h1>
        <Button asChild className="mt-6" variant="primary">
          <Link href={backPath}>Coba lagi</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <Clock className="h-4 w-4" />
          <span>Batas waktu: {countdown}</span>
        </div>

        <h1 className="mt-3 text-lg font-semibold text-ink">Selesaikan pembayaran</h1>
        <p className="mt-1 text-sm text-surface-600">
          {intent.channelName ?? intent.channelCode}
        </p>

        <div className="mt-4 space-y-2 rounded-xl bg-surface-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-600">{subtotalLabel}</span>
            <span className="font-medium">{formatIdr(intent.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-600">Biaya channel</span>
            <span className="font-medium">{formatIdr(intent.feeAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-surface-200 pt-2 font-semibold">
            <span>Total bayar</span>
            <span className="text-primary-700">{formatIdr(intent.amount)}</span>
          </div>
        </div>

        {intent.qrUrl && (
          <div className="mt-6 flex justify-center">
            <Image
              src={intent.qrUrl}
              alt="QRIS pembayaran"
              width={220}
              height={220}
              className="rounded-lg border border-surface-200"
              unoptimized
            />
          </div>
        )}

        {intent.payCode && (
          <div className="mt-6">
            <p className="text-xs font-medium text-surface-500">Kode / nomor pembayaran</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-surface-100 px-3 py-2 text-sm font-mono break-all">
                {intent.payCode}
              </code>
              <Button type="button" variant="outline" size="sm" onClick={copyPayCode}>
                <Copy className="h-4 w-4" />
                {copied ? 'Tersalin' : 'Salin'}
              </Button>
            </div>
          </div>
        )}

        {intent.checkoutUrl && (
          <Button asChild className="mt-6 w-full" variant="primary">
            <a href={intent.checkoutUrl} target="_blank" rel="noopener noreferrer">
              Buka halaman pembayaran
            </a>
          </Button>
        )}

        {intent.payUrl && !intent.checkoutUrl && (
          <Button asChild className="mt-6 w-full" variant="primary">
            <a href={intent.payUrl} target="_blank" rel="noopener noreferrer">
              Lanjutkan pembayaran
            </a>
          </Button>
        )}

        <p className={cn('mt-4 text-center text-xs text-surface-500')}>
          Halaman ini memperbarui status otomatis setiap 5 detik.
        </p>
      </div>
    </div>
  )
}
