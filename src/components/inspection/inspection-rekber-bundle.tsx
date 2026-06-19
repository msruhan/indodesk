'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateRekberFee } from '@/lib/rekber-config'
import type { InspectionOrderDto } from '@/lib/inspection-serializer'
import { Shield } from '@/lib/icons'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

type Props = {
  inspectionId: string
  productName: string
  teknisiName: string
  onCreated: (order: InspectionOrderDto) => void
}

export function InspectionRekberBundle({
  inspectionId,
  productName,
  teknisiName,
  onCreated,
}: Props) {
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amountNum = parseInt(amount, 10) || 0
  const fee = amountNum > 0 ? calculateRekberFee(amountNum) : 0
  const total = amountNum + fee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (amountNum < 10000) {
      setError('Nominal minimal Rp 10.000')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/user/inspeksi/${inspectionId}/rekber`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          description: `Transaksi aman pembelian: ${productName}`,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Gagal membuat transaksi aman')
        return
      }
      if (data.data?.inspection) onCreated(data.data.inspection)
    } catch {
      setError('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50/80 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-violet-600" />
          Beli aman dengan Transaksi Aman
        </CardTitle>
        <p className="text-xs text-surface-600">
          Setelah inspeksi layak, lanjutkan pembelian ke {teknisiName} dengan dana ditahan escrow hingga
          barang diterima.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600">
              Nominal kesepakatan beli (Rp) *
            </label>
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
          {amountNum > 0 && (
            <div className="rounded-xl bg-white/80 px-3 py-2 text-xs text-surface-600">
              <p>Nominal: {formatPrice(amountNum)}</p>
              <p>Biaya layanan: {formatPrice(fee)}</p>
              <p className="font-semibold text-ink">Total ditahan: {formatPrice(total)}</p>
            </div>
          )}
          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            {submitting ? 'Membuat transaksi…' : 'Buat Transaksi Aman'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

type LinkedProps = {
  orderCode: string
  statusLabel: string
  href: string
}

export function InspectionRekberLinked({ orderCode, statusLabel, href }: LinkedProps) {
  return (
    <Card className="border-violet-200 bg-violet-50/40">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-ink">Transaksi aman terhubung</p>
          <p className="text-xs text-surface-500">
            {orderCode} · {statusLabel}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>Kelola transaksi</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
