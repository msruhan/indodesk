'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand/brand-logo'
import { cn } from '@/lib/utils'
import { Download, X } from '@/lib/icons'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'
import {
  buildMarketplaceOrderInvoice,
  formatInvoiceDate,
  formatInvoicePrice,
  type MarketplaceOrderInvoiceData,
} from '@/lib/marketplace-order-invoice'

type MarketplaceOrderInvoiceModalProps = {
  order: MarketplaceOrderDto | null
  onClose: () => void
}

function InvoiceSummaryRow({
  line,
}: {
  line: MarketplaceOrderInvoiceData['summaryLines'][number]
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-2 text-[10px] sm:gap-4 sm:text-sm',
        line.emphasis && 'border-t border-surface-200 pt-1 font-semibold text-ink sm:pt-2',
      )}
    >
      <span className={cn('min-w-0 text-surface-600', line.emphasis && 'text-ink')}>{line.label}</span>
      <span
        className={cn(
          'shrink-0 tabular-nums',
          line.negative && 'text-primary-700',
          line.emphasis && 'text-[11px] font-bold text-primary-700 sm:text-base',
          !line.negative && !line.emphasis && 'text-ink',
        )}
      >
        {line.negative ? '−' : ''}
        {formatInvoicePrice(line.amount)}
      </span>
    </div>
  )
}

function InvoiceDocument({ invoice }: { invoice: MarketplaceOrderInvoiceData }) {
  const watermarkClass =
    invoice.paymentStatus === 'paid'
      ? 'text-primary-600/10 border-primary-300/20'
      : invoice.paymentStatus === 'cancelled'
        ? 'text-rose-500/10 border-rose-300/20'
        : 'text-amber-500/10 border-amber-300/20'

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-surface-200 bg-white p-2.5 shadow-soft-sm sm:rounded-2xl sm:p-6 md:p-8">
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute left-1/2 top-1/2 max-w-full -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] select-none rounded-lg border px-2 py-1 text-center text-xl font-black tracking-[0.12em] sm:rounded-xl sm:px-6 sm:py-3 sm:text-4xl sm:tracking-[0.2em] md:text-5xl',
          watermarkClass,
        )}
      >
        {invoice.paymentStatusLabel}
      </div>

      <div className="relative z-10 space-y-2.5 sm:space-y-6">
        <div className="flex items-start justify-between gap-2 border-b border-surface-200 pb-2 sm:gap-4 sm:pb-5">
          <div className="min-w-0 flex-1">
            <BrandLogo
              variant="wordmark"
              wordmarkClassName="h-7 w-auto max-w-[7.5rem] origin-left object-contain object-left sm:h-12 sm:max-w-[13rem] md:h-14 md:max-w-[15rem]"
            />
            <p className="mt-0.5 text-[8px] text-surface-500 sm:mt-1.5 sm:text-xs">
              Invoice pembelian marketplace
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-bold tracking-[0.12em] text-ink sm:text-lg sm:tracking-[0.18em]">
              INVOICE
            </p>
            <p className="mt-0.5 font-mono text-[9px] font-semibold text-primary-700 sm:mt-1 sm:text-xs">
              No. {invoice.invoiceNumber}
            </p>
            <p className="text-[8px] text-surface-500 sm:text-[11px]">Order {invoice.orderCode}</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 sm:gap-6">
          <section className="min-w-0">
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-surface-500 sm:text-[10px] sm:tracking-[0.16em]">
              Diterbitkan atas nama
            </p>
            <p className="mt-0.5 break-words text-[10px] font-semibold text-ink sm:mt-2 sm:text-sm">
              Penjual: {invoice.seller.name}
            </p>
            <p className="mt-0.5 text-[9px] text-surface-500 sm:mt-1 sm:text-xs">
              Platform: {invoice.platformName}
            </p>
          </section>
          <section className="min-w-0">
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-surface-500 sm:text-[10px] sm:tracking-[0.16em]">
              Untuk
            </p>
            <p className="mt-0.5 break-words text-[10px] font-semibold text-ink sm:mt-2 sm:text-sm">
              Pembeli: {invoice.buyer.name}
            </p>
            {invoice.buyer.email && (
              <p className="mt-0.5 break-all text-[9px] text-surface-500 sm:mt-1 sm:text-xs">
                {invoice.buyer.email}
              </p>
            )}
            <p className="mt-0.5 text-[9px] text-surface-500 sm:mt-1 sm:text-xs">
              Tanggal: {formatInvoiceDate(invoice.purchaseDate)}
            </p>
          </section>
        </div>

        {invoice.shippingAddress && (
          <div className="rounded-lg bg-surface-50 px-2 py-1.5 sm:rounded-xl sm:px-3 sm:py-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-surface-500 sm:text-[10px] sm:tracking-[0.14em]">
              Alamat pengiriman
            </p>
            <p className="mt-0.5 break-words text-[9px] leading-snug text-surface-700 sm:mt-1 sm:text-xs sm:leading-relaxed">
              {invoice.shippingAddress}
              {invoice.shippingPhone ? ` · ${invoice.shippingPhone}` : ''}
            </p>
            {invoice.shippingCourierLabel && (
              <p className="mt-0.5 break-words text-[9px] text-surface-500 sm:mt-1 sm:text-[11px]">
                Kurir: {invoice.shippingCourierLabel}
                {invoice.shippingService ? ` · ${invoice.shippingService}` : ''}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5 sm:hidden">
          <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-surface-500">
            Produk
          </p>
          {invoice.items.map((item) => (
            <div
              key={`${item.name}-${item.quantity}`}
              className="rounded-lg border border-surface-100 bg-white px-2 py-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 text-[10px] font-medium leading-snug text-primary-700">
                  {item.name}
                </p>
                <p className="shrink-0 text-[10px] font-semibold tabular-nums text-ink">
                  {formatInvoicePrice(item.lineTotal)}
                </p>
              </div>
              <p className="mt-0.5 text-[9px] tabular-nums text-surface-500">
                {item.quantity} × {formatInvoicePrice(item.unitPrice)}
              </p>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-hidden sm:block">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-surface-200 text-[10px] font-bold uppercase tracking-[0.14em] text-surface-500">
                <th className="w-[40%] pb-3 pr-4">Info produk</th>
                <th className="w-[12%] pb-3 px-2 text-center">Jumlah</th>
                <th className="w-[24%] pb-3 px-2 text-right">Harga satuan</th>
                <th className="w-[24%] pb-3 pl-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={`${item.name}-${item.quantity}`} className="border-b border-surface-100">
                  <td className="break-words py-3 pr-4 font-medium text-primary-700">{item.name}</td>
                  <td className="px-2 py-3 text-center tabular-nums text-surface-700">{item.quantity}</td>
                  <td className="px-2 py-3 text-right tabular-nums text-surface-700">
                    {formatInvoicePrice(item.unitPrice)}
                  </td>
                  <td className="py-3 pl-2 text-right font-semibold tabular-nums text-ink">
                    {formatInvoicePrice(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-0.5 sm:space-y-2">
          {invoice.summaryLines.map((line) => (
            <InvoiceSummaryRow key={line.label} line={line} />
          ))}
        </div>

        <div className="rounded-lg border border-surface-200 bg-surface-50/80 px-2 py-1.5 text-[9px] text-surface-600 sm:rounded-xl sm:px-4 sm:py-3 sm:text-xs">
          <p className="break-words">
            <span className="font-semibold text-ink">Metode pembayaran:</span>{' '}
            {invoice.paymentMethodLabel}
          </p>
          <p className="mt-0.5 break-words sm:mt-1">
            <span className="font-semibold text-ink">Status pesanan:</span> {invoice.orderStatusLabel}
          </p>
        </div>

        <p className="text-center text-[8px] leading-snug text-surface-400 sm:text-[11px] sm:leading-relaxed">
          Invoice elektronik {invoice.platformName} · sah tanpa tanda tangan basah.
        </p>
      </div>
    </div>
  )
}

export function MarketplaceOrderInvoiceModal({ order, onClose }: MarketplaceOrderInvoiceModalProps) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const invoice = useMemo(
    () => (order ? buildMarketplaceOrderInvoice(order) : null),
    [order],
  )

  useEffect(() => {
    if (!order) return
    setDownloadError(null)
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

  const handleDownloadPdf = async () => {
    if (!order) return
    setDownloading(true)
    setDownloadError(null)
    try {
      const res = await fetch(`/api/user/marketplace/orders/${order.id}/invoice`)
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        setDownloadError(json?.error ?? 'Gagal mengunduh PDF')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `invoice-${order.orderCode}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError('Gagal mengunduh PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <AnimatePresence>
      {order && invoice && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-ink/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed inset-0 z-[111] flex items-end justify-center p-0 sm:items-center sm:p-6"
          >
            <div
              className="relative flex h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-surface-200/80 bg-surface-50 shadow-2xl sm:h-auto sm:max-h-[min(92vh,900px)] sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-surface-200 bg-white px-2.5 py-1.5 sm:px-6 sm:py-3">
                <div className="min-w-0 pr-2">
                  <p className="truncate text-xs font-semibold text-ink sm:text-sm">Invoice Pesanan</p>
                  <p className="truncate font-mono text-[10px] text-surface-500 sm:text-xs">{order.orderCode}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[10px] sm:h-9 sm:px-3 sm:text-sm"
                    disabled={downloading}
                    onClick={() => void handleDownloadPdf()}
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="sr-only sm:not-sr-only sm:inline">
                      {downloading ? 'Mengunduh…' : 'Unduh PDF'}
                    </span>
                  </Button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-ink sm:h-9 sm:w-9"
                    aria-label="Tutup invoice"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-2 sm:p-6">
                <InvoiceDocument invoice={invoice} />
                {downloadError && (
                  <p className="mt-2 text-center text-[10px] text-rose-600 sm:mt-3 sm:text-xs">
                    {downloadError}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
