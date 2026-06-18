'use client'

import { useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CheckSquare,
  Copy,
  MapPin,
  MessageCircle,
  User,
  X,
} from '@/lib/icons'
import type { InspectionOrderDto } from '@/lib/inspection-serializer'
import type { InspectionUiStatus } from '@/lib/inspection-labels'
import { toast } from 'sonner'

function formatPrice(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
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

function statusBadgeVariant(status: InspectionUiStatus) {
  switch (status) {
    case 'completed':
      return 'success' as const
    case 'waiting':
    case 'accepted':
      return 'warning' as const
    case 'in_progress':
    case 'report_ready':
      return 'default' as const
    case 'rejected':
    case 'cancelled':
      return 'danger' as const
    case 'disputed':
      return 'warning' as const
    default:
      return 'default' as const
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

type InspeksiDetailModalProps = {
  order: InspectionOrderDto | null
  onClose: () => void
  acting?: boolean
  onAccept?: () => void
  onReject?: () => void
  onStart?: () => void
}

export function InspeksiDetailModal({
  order,
  onClose,
  acting = false,
  onAccept,
  onReject,
  onStart,
}: InspeksiDetailModalProps) {
  useEffect(() => {
    if (!order) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [order, onClose])

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            key="inspeksi-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="inspeksi-detail-dialog"
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
                  Detail Inspeksi
                </p>
                <p className="font-mono text-sm font-semibold text-ink">{order.orderCode}</p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Tutup">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusBadgeVariant(order.status)}>{order.statusLabel}</Badge>
                <Badge variant="outline" className="text-[10px]">
                  {order.modeLabel}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {order.categoryLabel}
                </Badge>
              </div>

              <section className="space-y-3 rounded-xl border border-surface-200/80 bg-surface-50/50 p-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-surface-600">
                  <User className="h-3.5 w-3.5" />
                  Pemesan
                </h3>
                <dl className="space-y-2.5">
                  <DetailRow label="Nama">{order.user?.name ?? '—'}</DetailRow>
                  {order.user?.email && <DetailRow label="Email">{order.user.email}</DetailRow>}
                </dl>
              </section>

              <section className="space-y-3 rounded-xl border border-surface-200/80 bg-surface-50/50 p-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-surface-600">
                  <CheckSquare className="h-3.5 w-3.5" />
                  Produk & Layanan
                </h3>
                <dl className="space-y-2.5">
                  <DetailRow label="Produk">{order.productName}</DetailRow>
                  {(order.productBrand || order.productModel) && (
                    <DetailRow label="Merek/Model">
                      {[order.productBrand, order.productModel].filter(Boolean).join(' · ') || '—'}
                    </DetailRow>
                  )}
                  <DetailRow label="Sumber">{order.productSourceLabel}</DetailRow>
                  <DetailRow label="Nilai">{formatPrice(order.price)}</DetailRow>
                  <DetailRow label="Pendapatan teknisi">{formatPrice(order.teknisiEarning)}</DetailRow>
                  <DetailRow label="Dipesan">{formatDate(order.createdAt)}</DetailRow>
                  {order.scheduledAt && (
                    <DetailRow label="Jadwal">{formatDate(order.scheduledAt)}</DetailRow>
                  )}
                </dl>
              </section>

              {(order.location || order.city || order.sellerContact) && (
                <section className="space-y-3 rounded-xl border border-primary-200/70 bg-primary-50/30 p-4">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary-800">
                    <MapPin className="h-3.5 w-3.5" />
                    Lokasi & Kontak
                  </h3>
                  <dl className="space-y-2.5">
                    {order.location && <DetailRow label="Lokasi">{order.location}</DetailRow>}
                    {order.city && <DetailRow label="Kota">{order.city}</DetailRow>}
                    {order.sellerContact && (
                      <DetailRow label="Kontak penjual">
                        <span className="inline-flex items-center gap-2">
                          {order.sellerContact}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => void copyText('Kontak', order.sellerContact!)}
                          >
                            <Copy className="h-3 w-3" />
                            Salin
                          </Button>
                        </span>
                      </DetailRow>
                    )}
                  </dl>
                </section>
              )}

              {order.notes?.trim() && (
                <section className="space-y-3 rounded-xl border border-surface-200/80 bg-surface-50/50 p-4">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-surface-600">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Catatan Pemesan
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-ink">{order.notes}</p>
                </section>
              )}

              {order.report && (
                <section className="space-y-2 rounded-xl border border-surface-200/80 bg-surface-50/50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-surface-600">
                    Laporan Inspeksi
                  </h3>
                  <p className="text-sm font-medium text-ink">{order.report.recommendationLabel}</p>
                  <p className="text-xs text-surface-500">
                    {order.report.overallConditionLabel} · {formatDate(order.report.submittedAt)}
                  </p>
                  <p className="whitespace-pre-line text-sm text-surface-700">{order.report.findings}</p>
                </section>
              )}

              {order.status === 'completed' && order.ratingByUser != null && (
                <section className="space-y-2 rounded-xl border border-surface-200/80 bg-surface-50/50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-surface-600">
                    Ulasan Pembeli
                  </h3>
                  <p className="text-sm">
                    <span className="font-semibold text-amber-600">{order.ratingByUser}</span>
                    <span className="text-amber-400"> ★</span>
                  </p>
                  {order.reviewByUser?.trim() && (
                    <p className="whitespace-pre-wrap text-sm text-surface-700">{order.reviewByUser}</p>
                  )}
                </section>
              )}

              {order.status === 'completed' && order.ratingByUser == null && (
                <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-800">
                  Menunggu rating dari pembeli setelah inspeksi selesai.
                </p>
              )}

              <div className="flex flex-wrap gap-2 border-t border-surface-100 pt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href={order.chatHref}>Chat pembeli</Link>
                </Button>
                {order.canAccept && onAccept && (
                  <Button size="sm" disabled={acting} onClick={onAccept}>
                    Terima
                  </Button>
                )}
                {order.canReject && onReject && (
                  <Button size="sm" variant="outline" disabled={acting} onClick={onReject}>
                    Tolak
                  </Button>
                )}
                {order.canStart && onStart && (
                  <Button size="sm" disabled={acting} onClick={onStart}>
                    Mulai inspeksi
                  </Button>
                )}
                {(order.canSubmitReport || order.report) && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/teknisi/inspeksi/${order.id}`}>
                      {order.canSubmitReport ? 'Isi laporan' : 'Lihat laporan lengkap'}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
