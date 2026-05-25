'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { calculateRekberFee } from '@/lib/rekber-config'
import type { PublicTeknisiDto } from '@/lib/teknisi-public'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

type Props = {
  onSuccess?: () => void
  onCancel?: () => void
}

export function RekberCreateForm({ onSuccess, onCancel }: Props) {
  const router = useRouter()
  const { status: sessionStatus } = useSession()
  const [teknisi, setTeknisi] = useState<PublicTeknisiDto[]>([])
  const [sellerId, setSellerId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/teknisi')
        const json = await res.json()
        if (res.ok && json.success) setTeknisi(json.data ?? [])
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const amountNum = parseInt(amount, 10) || 0
  const fee = amountNum > 0 ? calculateRekberFee(amountNum) : 0
  const total = amountNum + fee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sellerId || amountNum < 10000) {
      setError('Pilih penjual dan nominal minimal Rp 10.000')
      return
    }

    if (sessionStatus !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent('/rekber')}`)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/rekber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          amount: amountNum,
          description: description.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal membuat rekber')
        return
      }
      onSuccess?.()
      router.push('/user/rekber')
    } catch {
      setError('Gagal membuat rekber')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Ajukan Jasa Rekber</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Penjual (Teknisi)</label>
            <select
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="h-10 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-sm"
              required
            >
              <option value="">Pilih penjual…</option>
              {teknisi.map((t) => (
                <option key={t.id} value={t.userId}>
                  {t.name} — {t.specialty[0] ?? 'Teknisi'}
                </option>
              ))}
            </select>
          </div>

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
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Membuat…' : 'Buat Rekber'}
            </Button>
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
