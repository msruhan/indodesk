'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard } from '@/lib/icons'
import { cn } from '@/lib/utils'

type TripayChannelOption = {
  code: string
  name: string
  group: string
  iconUrl: string
}

type TripayChannelPickerProps = {
  purpose: 'WALLET_TOPUP' | 'KONSULTASI' | 'MARKETPLACE' | 'CATALOG_TOPUP'
  subtotal?: number
  targetId?: string
  onSuccess: (merchantRef: string) => void
  onCancel?: () => void
  submitLabel?: string
}

export function TripayChannelPicker({
  purpose,
  subtotal,
  targetId,
  onSuccess,
  onCancel,
  submitLabel = 'Lanjutkan pembayaran',
}: TripayChannelPickerProps) {
  const [channels, setChannels] = useState<TripayChannelOption[]>([])
  const [channelCode, setChannelCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch('/api/payments/tripay/channels')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setChannels(data.data)
          if (data.data.length > 0) setChannelCode(data.data[0].code)
        } else {
          setError(data.error || 'Gagal memuat channel')
        }
      })
      .catch(() => setError('Gagal memuat channel'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!channelCode) return
    setSubmitting(true)
    setError('')
    try {
      const body =
        purpose === 'WALLET_TOPUP'
          ? { purpose, channelCode, subtotal }
          : { purpose, channelCode, targetId }

      const res = await fetch('/api/payments/tripay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Gagal membuat pembayaran')
        return
      }
      onSuccess(data.data.merchantRef as string)
    } catch {
      setError('Gagal membuat pembayaran')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="py-6 text-center text-sm text-surface-500">Memuat channel pembayaran…</p>
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {channels.length === 0 ? (
        <p className="text-center text-sm text-surface-500">Tidak ada channel tersedia</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {channels.map((ch) => (
            <button
              key={ch.code}
              type="button"
              onClick={() => setChannelCode(ch.code)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                channelCode === ch.code
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-surface-200 hover:border-primary-300',
              )}
            >
              {ch.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ch.iconUrl} alt="" className="h-8 w-8 object-contain" />
              ) : (
                <CreditCard className="h-8 w-8 text-surface-400" />
              )}
              <div>
                <p className="text-sm font-medium text-ink">{ch.name}</p>
                <p className="text-xs text-surface-500">{ch.group}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-surface-500">
        Biaya channel Tripay ditambahkan pada total bayar.
      </p>

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" size="sm" onClick={onCancel}>
            Kembali
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          className="flex-1"
          size="sm"
          disabled={!channelCode || submitting || channels.length === 0}
          onClick={() => void handleSubmit()}
        >
          {submitting ? 'Memproses…' : submitLabel}
        </Button>
      </div>
    </div>
  )
}
