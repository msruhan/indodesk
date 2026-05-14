'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { Button } from '@/components/ui/button'
import { OrderStatusTimeline } from '@/components/topup/order/order-status-timeline'
import { useTopup, type OrderHistoryEntry } from '@/contexts/topup-context'
import { findProduct } from '@/data/mock-topup'
import { formatIDR } from '@/lib/topup-utils'
import { ArrowRight, CheckCircle, Copy, Headphones, RefreshCw } from '@/lib/icons'
import type { OrderStatus } from '@/data/topup-types'

const advance: Record<OrderStatus, OrderStatus> = {
  'pending-payment': 'paid',
  paid: 'processing',
  processing: 'fulfilling',
  fulfilling: 'completed',
  completed: 'completed',
  failed: 'failed',
}

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>()
  const { getOrder, saveOrder, history } = useTopup()
  const [order, setOrder] = useState<OrderHistoryEntry | undefined>(undefined)
  const [hydrated, setHydrated] = useState(false)
  const [copied, setCopied] = useState(false)

  // Hydrate after mount (history comes from localStorage).
  useEffect(() => {
    const found = getOrder(params.id)
    setOrder(found)
    setHydrated(true)
    // also re-look-up when history changes
  }, [getOrder, params.id, history])

  // Auto-advance status to simulate fulfillment.
  useEffect(() => {
    if (!order) return
    if (order.status === 'completed' || order.status === 'failed') return

    const id = window.setTimeout(() => {
      const next = advance[order.status]
      if (next !== order.status) {
        const updated = { ...order, status: next }
        saveOrder(updated)
        setOrder(updated)
      }
    }, 3500)
    return () => window.clearTimeout(id)
  }, [order, saveOrder])

  if (hydrated && !order) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-surface-50">
        <div className="hidden lg:block">
          <Navbar />
        </div>
        <main className="mx-auto max-w-md px-4 pb-12 pt-12 text-center sm:px-6 lg:pt-32">
          <div className="rounded-2xl border border-surface-200/70 bg-white p-8 shadow-soft-sm">
            <h1 className="text-lg font-semibold text-ink">Order tidak ditemukan</h1>
            <p className="mt-2 text-sm text-surface-600">
              Kode order <span className="font-mono text-ink">{params.id}</span> tidak ada di history kamu.
              Coba cek transaksi via halaman pencarian.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Link href="/topup/cek-transaksi">
                <Button variant="primary" size="sm">Cek transaksi</Button>
              </Link>
              <Link href="/topup">
                <Button variant="outline" size="sm">Kembali ke top up</Button>
              </Link>
            </div>
          </div>
        </main>
        <MobileSafeAreaSpacer />
        <BottomNav />
      </div>
    )
  }

  if (!order) return null

  const product = findProduct(order.productSlug)
  const completed = order.status === 'completed'

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(order.orderCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="mx-auto max-w-3xl px-4 pb-12 pt-5 sm:px-6 lg:pt-28">
        {/* Status hero */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-surface-200/70 bg-white p-5 shadow-soft-md sm:p-6"
        >
          <div className="aurora-blob pointer-events-none absolute -right-20 -top-20 h-56 w-56 opacity-50">
            <div className="h-full w-full rounded-full bg-gradient-to-br from-primary-300 to-accent-300 blur-3xl" />
          </div>

          <div className="relative flex items-start gap-4">
            <span
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-soft-md ${
                completed
                  ? 'bg-gradient-to-br from-primary-500 to-emerald-500'
                  : 'bg-gradient-to-br from-primary-500 to-accent-500'
              }`}
            >
              {completed ? (
                <CheckCircle weight="fill" className="h-6 w-6" />
              ) : (
                <RefreshCw className="h-5 w-5 animate-spin" style={{ animationDuration: '2.4s' }} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary-700">
                Status order
              </p>
              <h1 className="mt-0.5 text-balance text-xl font-semibold tracking-tightest text-ink sm:text-2xl">
                {completed ? 'Top up berhasil!' : 'Order kamu sedang diproses'}
              </h1>
              <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-surface-600">
                {completed
                  ? `Item ${order.denominationLabel} sudah masuk ke akun ${order.accountId}. Cek inventory game kamu sekarang.`
                  : 'Kami akan update status secara otomatis. Halaman ini akan refresh sendiri.'}
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-200/70 bg-surface-50/60 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-surface-500">
                Kode order
              </p>
              <p className="mt-0.5 truncate font-mono text-sm font-bold text-ink">
                {order.orderCode}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 flex-shrink-0"
              onClick={copyCode}
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Disalin' : 'Salin'}
            </Button>
          </div>
        </motion.section>

        {/* Product summary */}
        <section className="mt-4 rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-xs sm:p-5">
          <div className="flex items-start gap-3">
            {product && (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-surface-200 bg-white p-1.5">
                <img src={product.logo} alt={product.name} className="max-h-full max-w-full object-contain" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">
                {order.productName}
              </p>
              <p className="text-sm font-semibold text-ink">{order.denominationLabel}</p>
              <p className="mt-0.5 text-[11px] text-surface-500">
                Tujuan: <span className="text-ink">{order.accountId}</span>
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-[0.14em] text-surface-500">Total</p>
              <p className="text-base font-bold tracking-tight-lg text-primary-700 tabular-nums">
                {formatIDR(order.total)}
              </p>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="mt-4 rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-xs sm:p-5">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-surface-600">
            Status fulfillment
          </h2>
          <OrderStatusTimeline status={order.status} paid />
        </section>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link href="/topup" className="flex-1">
            <Button variant="primary" size="lg" className="w-full">
              Top up lagi
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="flex-1">
            <Headphones className="h-4 w-4" />
            Hubungi CS
          </Button>
        </div>
      </main>

      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
