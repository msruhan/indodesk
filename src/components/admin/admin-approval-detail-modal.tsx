'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ApprovalQueueItem } from '@/lib/approval-queue'
import type {
  ApprovalDetail,
  ApprovalProductDetail,
  ApprovalStoreDetail,
  ApprovalTeknisiDetail,
} from '@/lib/approval-detail-types'
import { CheckCircle, Package, Store, User, X, XCircle } from '@/lib/icons'
import {
  completenessLabel,
  getProductSpecDisplayRows,
  warrantyLabel,
} from '@/lib/product-specs'
import { formatCouponLabel } from '@/lib/product-coupon'
import { workshopTypeLabel } from '@/lib/teknisi-registration'

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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-surface-100 py-2.5 last:border-0">
      <span className="shrink-0 text-xs text-surface-500">{label}</span>
      <span className="min-w-0 text-right text-xs font-medium text-ink">{value}</span>
    </div>
  )
}

function ImageGallery({
  images,
  primaryUrl,
  alt,
}: {
  images: { url: string; isPrimary?: boolean }[]
  primaryUrl: string | null
  alt: string
}) {
  const urls =
    images.length > 0
      ? images.map((i) => i.url)
      : primaryUrl
        ? [primaryUrl]
        : []

  if (urls.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-surface-200 bg-surface-50 text-xs text-surface-400">
        Tidak ada foto
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {urls.map((url, idx) => {
        const isPrimary =
          images.find((i) => i.url === url)?.isPrimary ?? url === primaryUrl
        return (
          <div
            key={`${url}-${idx}`}
            className={cn(
              'relative aspect-square overflow-hidden rounded-xl border bg-surface-100',
              isPrimary ? 'border-primary-500 ring-2 ring-primary-200' : 'border-surface-200',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={alt} className="h-full w-full object-cover" />
            {isPrimary && (
              <span className="absolute left-1 top-1 rounded bg-primary-600 px-1 py-0.5 text-[8px] font-bold text-white">
                Utama
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ProductDetailBody({ detail }: { detail: ApprovalProductDetail }) {
  return (
    <>
      {detail.pendingChangeSummary ? (
        <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/90 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Perubahan diajukan teknisi
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-950">
            {detail.pendingChangeSummary}
          </p>
        </div>
      ) : detail.listingStatus === 'PENDING' ? (
        <div className="mb-4 rounded-xl border border-surface-200 bg-surface-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-surface-600">
            Perubahan diajukan teknisi
          </p>
          <p className="mt-1 text-xs text-surface-600">
            Ringkasan perubahan belum tercatat untuk pengajuan ini. Minta teknisi menyimpan ulang
            perubahan, atau bandingkan data di bawah dengan versi sebelumnya.
          </p>
        </div>
      ) : null}
      <ImageGallery images={detail.images} primaryUrl={detail.image} alt={detail.name} />
      <div className="mt-4 rounded-xl border border-surface-100 bg-surface-50/50 p-3">
        <DetailRow label="Nama produk" value={detail.name} />
        <DetailRow label="Kategori" value={detail.category} />
        <DetailRow label="Harga" value={formatPrice(detail.price)} />
        <DetailRow label="Stok" value={detail.stock.toLocaleString('id-ID')} />
        {detail.couponCode &&
        detail.couponDiscountType &&
        detail.couponDiscountValue != null ? (
          <DetailRow
            label="Kupon diskon"
            value={`${detail.couponCode} · ${formatCouponLabel({
              code: detail.couponCode,
              discountType: detail.couponDiscountType,
              discountValue: detail.couponDiscountValue,
            })}`}
          />
        ) : null}
        {getProductSpecDisplayRows(detail.categoryValue, {
          color: detail.color,
          ram: detail.ram,
          processor: detail.processor,
          storage: detail.storage,
          warranty: detail.warranty,
          completeness: detail.completeness,
        }).map((row) => (
          <DetailRow key={row.label} label={row.label} value={row.value} />
        ))}
        <DetailRow
          label="Kelengkapan"
          value={
            detail.completeness.length > 0
              ? detail.completeness.map(completenessLabel).join(', ')
              : '—'
          }
        />
        <DetailRow label="Dilihat" value={detail.views.toLocaleString('id-ID')} />
        <DetailRow label="Terjual" value={detail.soldCount.toLocaleString('id-ID')} />
        <DetailRow label="Status listing" value={detail.listingStatus} />
        <DetailRow label="Publik" value={detail.isPublished ? 'Ya' : 'Tidak'} />
        <DetailRow label="Diajukan" value={formatDate(detail.createdAt)} />
      </div>
      {detail.description && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold text-surface-600">Deskripsi</p>
          <p className="whitespace-pre-line rounded-xl border border-surface-100 bg-white p-3 text-xs leading-relaxed text-surface-700">
            {detail.description}
          </p>
        </div>
      )}
      <div className="mt-3 rounded-xl border border-surface-100 bg-white p-3">
        <p className="mb-2 text-xs font-semibold text-surface-600">Penjual</p>
        <DetailRow label="Nama teknisi" value={detail.seller.name} />
        <DetailRow label="Email" value={detail.seller.email} />
        <DetailRow label="Toko" value={detail.seller.storeName ?? '—'} />
      </div>
    </>
  )
}

function StoreDetailBody({ detail }: { detail: ApprovalStoreDetail }) {
  return (
    <>
      <ImageGallery
        images={[
          ...(detail.coverImage ? [{ url: detail.coverImage, isPrimary: true }] : []),
          ...detail.gallery.map((url) => ({ url })),
        ]}
        primaryUrl={detail.coverImage}
        alt={detail.name}
      />
      <div className="mt-4 rounded-xl border border-surface-100 bg-surface-50/50 p-3">
        <DetailRow label="Nama toko" value={detail.name} />
        <DetailRow label="Kota" value={detail.city ?? '—'} />
        <DetailRow label="Alamat" value={detail.address ?? '—'} />
        <DetailRow label="Telepon" value={detail.phone ?? '—'} />
        <DetailRow label="Email toko" value={detail.email ?? '—'} />
        <DetailRow label="Instagram" value={detail.instagram ?? '—'} />
        <DetailRow label="Status listing" value={detail.listingStatus} />
        <DetailRow label="Diajukan" value={formatDate(detail.createdAt)} />
      </div>
      {detail.layanan.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {detail.layanan.map((l) => (
            <Badge key={l} variant="outline" className="text-[10px]">
              {l}
            </Badge>
          ))}
        </div>
      )}
      {detail.operatingHoursLines.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold text-surface-600">Jam operasional</p>
          <pre className="whitespace-pre-line rounded-xl border border-surface-100 bg-white p-3 text-[11px] text-surface-700">
            {detail.operatingHoursLines.join('\n')}
          </pre>
        </div>
      )}
      <div className="mt-3 rounded-xl border border-surface-100 bg-white p-3">
        <DetailRow label="Pemilik" value={detail.owner.name} />
        <DetailRow label="Email" value={detail.owner.email} />
      </div>
    </>
  )
}

function TeknisiDetailBody({ detail }: { detail: ApprovalTeknisiDetail }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-surface-200 bg-surface-100">
          {detail.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={detail.coverImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-surface-400">Cover</div>
          )}
          <span className="absolute left-1 top-1 rounded bg-ink/60 px-1 text-[8px] text-white">Cover</span>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-surface-200 bg-surface-100">
          {detail.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={detail.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-surface-400">Avatar</div>
          )}
          <span className="absolute left-1 top-1 rounded bg-ink/60 px-1 text-[8px] text-white">Avatar</span>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-surface-100 bg-surface-50/50 p-3">
        <DetailRow label="Nama" value={detail.name} />
        <DetailRow label="Email" value={detail.email} />
        <DetailRow label="Telepon" value={detail.phone ?? '—'} />
        <DetailRow label="Lokasi" value={detail.location ?? '—'} />
        <DetailRow label="Pengalaman" value={detail.experience ?? '—'} />
        {detail.applicationData && (
          <>
            <DetailRow
              label="Jenis usaha"
              value={workshopTypeLabel(detail.applicationData.workshopType)}
            />
            <DetailRow label="Merek ditangani" value={detail.applicationData.brandsHandled} />
            {detail.applicationData.toolsUsed ? (
              <DetailRow label="Alat / software" value={detail.applicationData.toolsUsed} />
            ) : null}
            {detail.applicationData.portfolioUrl ? (
              <DetailRow label="Portfolio" value={detail.applicationData.portfolioUrl} />
            ) : null}
          </>
        )}
        {detail.rejectionReason && (
          <DetailRow label="Alasan penolakan" value={detail.rejectionReason} />
        )}
        <DetailRow label="Harga konsultasi" value={formatPrice(detail.price)} />
        <DetailRow label="Rating" value={`${detail.rating.toFixed(1)} (${detail.reviewCount} review)`} />
        <DetailRow label="Diajukan" value={formatDate(detail.createdAt)} />
      </div>
      {detail.tagline && (
        <p className="mt-3 rounded-xl border border-primary-100 bg-primary-50/50 p-3 text-xs italic text-surface-700">
          {detail.tagline}
        </p>
      )}
      {detail.specialty.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {detail.specialty.map((s) => (
            <Badge key={s} variant="primary" className="text-[10px]">
              {s}
            </Badge>
          ))}
        </div>
      )}
      {detail.description && (
        <p className="mt-3 whitespace-pre-line rounded-xl border border-surface-100 bg-white p-3 text-xs text-surface-700">
          {detail.description}
        </p>
      )}
    </>
  )
}

type AdminApprovalDetailModalProps = {
  item: ApprovalQueueItem | null
  detail: ApprovalDetail | null
  loading: boolean
  busy: boolean
  onClose: () => void
  onAction: (action: 'approve' | 'reject') => void
}

export function AdminApprovalDetailModal({
  item,
  detail,
  loading,
  busy,
  onClose,
  onAction,
}: AdminApprovalDetailModalProps) {
  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [item, onClose])

  const typeIcon =
    item?.type === 'Produk' ? Package : item?.type === 'Toko' ? Store : User

  const TypeIcon = typeIcon

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            key="approval-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="approval-detail-dialog"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative flex max-h-[min(92vh,800px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-surface-200/80 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-400 hover:bg-surface-100 hover:text-ink"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="border-b border-surface-100 bg-gradient-to-br from-primary-50/40 to-white px-6 pb-4 pt-8">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary-700">
                      Detail approval · {item.type}
                    </p>
                    <h2 className="pr-8 text-lg font-semibold text-ink">{item.name}</h2>
                  </div>
                </div>
                <p className="text-[11px] text-surface-500">
                  {item.submitter} · {item.date}
                </p>
                {item.status !== 'pending' && (
                  <p className="mt-1 text-[11px] font-medium text-primary-700">
                    Status:{' '}
                    {item.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loading ? (
                  <p className="py-12 text-center text-sm text-surface-500">Memuat detail…</p>
                ) : detail ? (
                  <>
                    {detail.entityType === 'product' && <ProductDetailBody detail={detail} />}
                    {detail.entityType === 'store' && <StoreDetailBody detail={detail} />}
                    {detail.entityType === 'teknisi' && <TeknisiDetailBody detail={detail} />}
                  </>
                ) : (
                  <p className="py-12 text-center text-sm text-rose-600">Gagal memuat detail.</p>
                )}
              </div>

              {item.status === 'pending' ? (
                <div className="flex gap-2 border-t border-surface-100 px-6 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                    disabled={busy || loading}
                    onClick={() => onAction('reject')}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1"
                    disabled={busy || loading}
                    onClick={() => onAction('approve')}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              ) : (
                <div className="border-t border-surface-100 px-6 py-4">
                  <Button type="button" variant="outline" className="w-full" onClick={onClose}>
                    Tutup
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
