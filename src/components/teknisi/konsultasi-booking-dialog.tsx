'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PublicTeknisiDetailDto } from '@/lib/teknisi-public-detail'
import type { TeknisiConsultationService } from '@/lib/konsultasi-services'
import { teknisiProfilePath } from '@/lib/teknisi-profile-slug'
import { TripayChannelPicker } from '@/components/payments/tripay-channel-picker'
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
  const [device, setDevice] = useState('')
  const [clientOs, setClientOs] = useState<'WINDOWS' | 'MACOS'>('WINDOWS')
  const [note, setNote] = useState('')
  const [remoteId, setRemoteId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paySession, setPaySession] = useState<{ sessionId: string; price: number } | null>(null)

  const requiresRemote = selected?.requiresRemote === true
  const price = selected?.price ?? 0

  useEffect(() => {
    if (!open || !requiresRemote || sessionStatus !== 'authenticated') return
    void (async () => {
      try {
        const res = await fetch('/api/indodesk/devices')
        const json = await res.json()
        if (!json.success) return
        const userDevice = (json.data.items as { role: string; rustdeskId: string }[]).find(
          (d) => d.role === 'user',
        )
        if (userDevice?.rustdeskId) {
          setRemoteId(userDevice.rustdeskId)
        }
      } catch {
        /* ignore */
      }
    })()
  }, [open, requiresRemote, sessionStatus])

  if (!open) return null

  const handleSubmit = async () => {
    if (!selected) return

    if (sessionStatus !== 'authenticated' || !session?.user) {
      const callback = encodeURIComponent(teknisiProfilePath(teknisi.profileSlug, teknisi.id))
      router.push(`/login?callbackUrl=${callback}`)
      return
    }

    if (!device.trim()) {
      setError('Perangkat wajib diisi')
      return
    }
    if (requiresRemote) {
      if (!remoteId.trim()) {
        setError('Kode pairing wajib — buat dan hubungkan di halaman Remote terlebih dahulu')
        return
      }
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
          device: device.trim(),
          clientOs,
          remoteId: requiresRemote ? remoteId.trim() : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memesan konsultasi')
        return
      }

      if (json.data?.needsPayment && json.data?.paymentGateway === 'tripay' && json.data?.sessionId) {
        setPaySession({
          sessionId: json.data.sessionId as string,
          price: selected.price,
        })
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
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-surface-200/80 bg-white p-5 shadow-soft-lg sm:rounded-3xl">
        <motion.div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">
              {paySession ? 'Pilih Pembayaran' : 'Pesan Konsultasi'}
            </h2>
            <p className="text-xs text-surface-500">
              {paySession ? 'Bayar via Tripay' : `dengan ${teknisi.name}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>

        {paySession ? (
          <TripayChannelPicker
            purpose="KONSULTASI"
            targetId={paySession.sessionId}
            submitLabel={`Bayar ${formatPrice(paySession.price)}`}
            onCancel={() => setPaySession(null)}
            onSuccess={(merchantRef) => {
              onClose()
              router.push(`/payments/${merchantRef}`)
            }}
          />
        ) : (
          <>
        <div className="mb-4 max-h-40 space-y-2 overflow-y-auto">
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
                  <p className="text-[11px] text-surface-500">
                    {svc.duration}
                    {svc.requiresRemote ? ' · Termasuk remote' : ''}
                  </p>
                </div>
                <p className="text-sm font-semibold text-primary-700 tabular-nums">
                  {formatPrice(svc.price)}
                </p>
              </button>
            ))}
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-surface-600">
            Perangkat <span className="text-red-500">*</span>
          </label>
          <Input
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            placeholder="Contoh: iPhone 13 Pro, Samsung A54"
            className="text-sm"
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-surface-600">
            Sistem operasi komputer Anda <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {(
              [
                ['WINDOWS', 'Windows'],
                ['MACOS', 'macOS'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setClientOs(value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  clientOs === value
                    ? 'border-primary-300 bg-primary-50 font-medium text-primary-800'
                    : 'border-surface-200 text-surface-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {requiresRemote && (
          <div className="mb-3 space-y-3 rounded-xl border border-primary-100 bg-primary-50/40 p-3">
            <p className="text-xs leading-relaxed text-primary-800">
              Layanan ini membutuhkan IndoDesk. Buat{' '}
              <span className="font-medium">kode pairing</span> di{' '}
              <Link href="/remote" className="font-semibold underline">
                halaman Remote
              </Link>
              , klik tombol <span className="font-medium">&quot;Buat kode pairing&quot;</span>,
              lalu masukkan kode 6 digit tersebut di aplikasi IndoDesk Anda (menu Pairing).
            </p>
            <p className="text-[11px] leading-relaxed text-primary-700/90">
              Belum punya IndoDesk?{' '}
              <Link href="/remote" className="font-medium underline">
                Download &amp; petunjuk lengkap
              </Link>
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">
                Kode Pairing <span className="text-red-500">*</span>
              </label>
              <Input
                value={remoteId}
                onChange={(e) => setRemoteId(e.target.value)}
                placeholder="Terisi otomatis setelah IndoDesk terhubung"
                className="text-sm"
              />
              <p className="mt-1 text-[10px] leading-relaxed text-surface-500">
                Muncul otomatis setelah pairing berhasil. Jika kosong, buka{' '}
                <Link href="/remote" className="font-medium text-primary-700 underline">
                  /remote
                </Link>{' '}
                dan selesaikan langkah hubungkan IndoDesk.
              </p>
            </div>
          </div>
        )}

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
          Bayar {formatPrice(price)} via QRIS atau Virtual Account sebelum teknisi mulai sesi.
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
            {submitting
              ? 'Memproses…'
              : `Bayar ${selected ? formatPrice(selected.price) : ''}`}
          </Button>
        </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
