'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PublicTeknisiDetailDto } from '@/lib/teknisi-public-detail'
import type { TeknisiConsultationService } from '@/lib/konsultasi-services'
import { X } from '@/lib/icons'

type Props = {
  teknisi: PublicTeknisiDetailDto
  open: boolean
  onClose: () => void
  initialService?: TeknisiConsultationService | null
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

export function KonsultasiBookingDialog({
  teknisi,
  open,
  onClose,
  initialService,
}: Props) {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [selected, setSelected] = useState<TeknisiConsultationService | null>(
    initialService ??
      teknisi.services.find((s) => s.kind === 'consultation') ??
      null,
  )
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async () => {
    if (!selected) return

    if (sessionStatus !== 'authenticated' || !session?.user) {
      const callback = encodeURIComponent(`/teknisi/${teknisi.id}`)
      router.push(`/login?callbackUrl=${callback}`)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/user/konsultasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teknisiId: teknisi.id,
          service: selected.name,
          price: selected.price,
          note: note.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memesan konsultasi')
        return
      }
      onClose()
      router.push('/user/konsultasi')
    } catch {
      setError('Gagal memesan konsultasi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Tutup"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-surface-200/80 bg-white p-5 shadow-soft-lg sm:rounded-3xl">
        <motion.div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Pesan Konsultasi</h2>
            <p className="text-xs text-surface-500">dengan {teknisi.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>

        <div className="mb-4 max-h-48 space-y-2 overflow-y-auto">
          {teknisi.services
            .filter((svc) => svc.kind === 'consultation')
            .map((svc) => (
              <button
                key={svc.name}
                type="button"
                onClick={() => setSelected(svc)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                  selected?.name === svc.name
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-surface-200/70 hover:border-primary-200'
                }`}
              >
                <div>
                  <p className="font-medium text-ink">{svc.name}</p>
                  <p className="text-[11px] text-surface-500">{svc.duration}</p>
                </div>
                <p className="text-sm font-semibold text-primary-700 tabular-nums">
                  {formatPrice(svc.price)}
                </p>
              </button>
            ))}
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-surface-600">
            Catatan (opsional)
          </label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Jelaskan masalah perangkat Anda..."
            className="text-sm"
          />
        </div>

        {error && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <p className="rounded-xl bg-surface-50 px-3 py-2 text-xs text-surface-600">
          Saldo akan dipotong saat pesanan dibuat. Refund otomatis jika dibatalkan saat status
          menunggu.
        </p>

        <div className="mt-4 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            disabled={!selected || submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? 'Memproses…' : `Bayar ${selected ? formatPrice(selected.price) : ''}`}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
