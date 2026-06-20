'use client'

import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Copy, Laptop, MessageCircle, Shield, User, X } from '@/lib/icons'
import type { TeknisiKonsultasiDto } from '@/lib/teknisi-layanan-serializer'
import { toast } from 'sonner'

function formatPrice(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function clientOsLabel(os: string | null): string {
  if (os === 'WINDOWS') return 'Windows'
  if (os === 'MACOS') return 'macOS'
  return os ?? '—'
}

function paymentStatusLabel(status: string): string {
  switch (status) {
    case 'UNPAID':
      return 'Belum dibayar'
    case 'HELD':
      return 'Saldo ditahan'
    case 'PAID':
      return 'Dibayar (PG)'
    case 'SECURED':
      return 'Dana aman'
    case 'CAPTURED':
      return 'Dicairkan ke teknisi'
    case 'RELEASED':
      return 'Dikembalikan'
    default:
      return status
  }
}

function statusBadgeVariant(status: TeknisiKonsultasiDto['status']) {
  switch (status) {
    case 'completed':
      return 'success' as const
    case 'pending':
    case 'awaiting_payment':
      return 'warning' as const
    case 'active':
      return 'default' as const
    case 'cancelled':
      return 'danger' as const
  }
}

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} disalin`)
  } catch {
    toast.error(`Gagal menyalin ${label.toLowerCase()}`)
  }
}

type DetailRowProps = {
  label: string
  children: ReactNode
  className?: string
}

function DetailRow({ label, children, className }: DetailRowProps) {
  return (
    <div className={cn('grid gap-1 sm:grid-cols-[140px_1fr]', className)}>
      <dt className="text-xs font-medium text-surface-500">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  )
}

type KonsultasiDetailModalProps = {
  konsultasi: TeknisiKonsultasiDto | null
  onClose: () => void
}

export function KonsultasiDetailModal({ konsultasi, onClose }: KonsultasiDetailModalProps) {
  useEffect(() => {
    if (!konsultasi) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [konsultasi, onClose])

  return (
    <AnimatePresence>
      {konsultasi && (
        <>
          <motion.div
            key="konsultasi-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="konsultasi-detail-dialog"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed inset-x-4 top-[8vh] z-[101] mx-auto max-h-[84vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-200/80 bg-white shadow-soft-lg sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-100 bg-white/95 px-5 py-4 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
                  Detail Konsultasi
                </p>
                <p className="font-mono text-sm font-semibold text-ink">{konsultasi.orderId}</p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Tutup">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusBadgeVariant(konsultasi.status)}>{konsultasi.statusLabel}</Badge>
                {konsultasi.requiresRemote && (
                  <Badge variant="outline" className="text-[10px]">
                    Remote
                  </Badge>
                )}
              </div>

              <section className="space-y-3 rounded-xl border border-surface-200/80 bg-surface-50/50 p-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-surface-600">
                  <User className="h-3.5 w-3.5" />
                  Pemesan
                </h3>
                <dl className="space-y-2.5">
                  <DetailRow label="Nama">{konsultasi.userName}</DetailRow>
                  {konsultasi.userEmail && (
                    <DetailRow label="Email">{konsultasi.userEmail}</DetailRow>
                  )}
                </dl>
              </section>

              <section className="space-y-3 rounded-xl border border-surface-200/80 bg-surface-50/50 p-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-surface-600">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Layanan & Pembayaran
                </h3>
                <dl className="space-y-2.5">
                  <DetailRow label="Layanan">{konsultasi.service}</DetailRow>
                  <DetailRow label="Nilai">{formatPrice(konsultasi.amount)}</DetailRow>
                  {konsultasi.platformFee > 0 && (
                    <>
                      <DetailRow label="Fee platform">
                        {formatPrice(konsultasi.platformFee)}
                      </DetailRow>
                      <DetailRow label="Pendapatan teknisi">
                        {formatPrice(konsultasi.teknisiEarning)}
                      </DetailRow>
                    </>
                  )}
                  <DetailRow label="Pembayaran">
                    {paymentStatusLabel(konsultasi.paymentStatus)}
                  </DetailRow>
                  <DetailRow label="Dipesan">{formatDate(konsultasi.createdAt)}</DetailRow>
                </dl>
              </section>

              <section className="space-y-3 rounded-xl border border-primary-200/70 bg-primary-50/30 p-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary-800">
                  <Laptop className="h-3.5 w-3.5" />
                  Informasi Perangkat
                </h3>
                <dl className="space-y-2.5">
                  <DetailRow label="Perangkat">{konsultasi.device?.trim() || '—'}</DetailRow>
                  <DetailRow label="OS">{clientOsLabel(konsultasi.clientOs)}</DetailRow>
                  <DetailRow label="Catatan">
                    {konsultasi.note?.trim() ? (
                      <span className="whitespace-pre-wrap">{konsultasi.note}</span>
                    ) : (
                      <span className="text-surface-500">Tidak ada catatan</span>
                    )}
                  </DetailRow>
                </dl>
              </section>

              {konsultasi.requiresRemote && (
                <section className="space-y-3 rounded-xl border border-teal-200/70 bg-teal-50/30 p-4">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-800">
                    <Shield className="h-3.5 w-3.5" />
                    IndoDesk Remote
                  </h3>
                  <dl className="space-y-2.5">
                    <DetailRow label="IndoDesk ID">
                      {konsultasi.remoteId ? (
                        <span className="inline-flex items-center gap-2 font-mono">
                          {konsultasi.remoteId}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => void copyText('ID', konsultasi.remoteId!)}
                          >
                            <Copy className="h-3 w-3" />
                            Salin
                          </Button>
                        </span>
                      ) : (
                        '—'
                      )}
                    </DetailRow>
                    {(konsultasi.status === 'pending' || konsultasi.status === 'active') && (
                      <DetailRow label="OTP">
                        {konsultasi.remoteOtp ? (
                          <span className="inline-flex items-center gap-2 font-mono text-primary-700">
                            {konsultasi.remoteOtp}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => void copyText('OTP', konsultasi.remoteOtp!)}
                            >
                              <Copy className="h-3 w-3" />
                              Salin
                            </Button>
                          </span>
                        ) : (
                          '—'
                        )}
                      </DetailRow>
                    )}
                  </dl>
                </section>
              )}

              {konsultasi.status === 'completed' && konsultasi.rating != null && (
                <section className="space-y-2 rounded-xl border border-surface-200/80 bg-surface-50/50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-surface-600">
                    Ulasan Pembeli
                  </h3>
                  <p className="text-sm">
                    <span className="font-semibold text-amber-600">{konsultasi.rating}</span>
                    <span className="text-amber-400"> ★</span>
                  </p>
                  {konsultasi.review?.trim() && (
                    <p className="text-sm text-surface-700 whitespace-pre-wrap">{konsultasi.review}</p>
                  )}
                </section>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
