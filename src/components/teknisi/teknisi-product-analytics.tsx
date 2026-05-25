'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { DashboardPanel } from '@/components/dashboard'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Eye,
  Package,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
} from '@/lib/icons'

type ProductAnalytic = {
  id: string
  name: string
  image: string | null
  category: string
  price: number
  views: number
  soldCount: number
  totalOrdered: number
  stock: number
  conversionRate: number
  isPublished: boolean
  listingStatus: string
}

type Summary = {
  totalProducts: number
  totalViews: number
  totalSold: number
  totalOrdered: number
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const categoryLabel: Record<string, string> = {
  HANDPHONE: 'Handphone',
  LAPTOP: 'Laptop',
  AKSESORIS: 'Aksesoris',
  SOFTWARE: 'Software',
  LAINNYA: 'Lainnya',
}

export function TeknisiProductAnalytics() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [products, setProducts] = useState<ProductAnalytic[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teknisi/products/analytics')
      const json = await res.json()
      if (res.ok && json.success) {
        setSummary(json.data.summary)
        setProducts(json.data.products)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <DashboardPanel
      title="Analitik Iklan Produk"
      description="Performa per iklan — views, order, konversi."
      action={
        <Link href="/teknisi/produk">
          <Button variant="outline" size="sm" className="gap-1.5">
            Kelola iklan
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-300 bg-surface-50/50 py-10 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-surface-400" />
          <p className="text-sm font-medium text-ink">Belum ada iklan produk</p>
          <p className="mt-1 text-[12px] text-surface-500">Buat iklan untuk melihat analitik performa.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary strip */}
          {summary && (
            <div className="grid grid-cols-4 gap-2">
              <MiniStat label="Produk" value={summary.totalProducts} icon={<Package className="h-3 w-3 text-primary-600" />} />
              <MiniStat label="Views" value={summary.totalViews} icon={<Eye className="h-3 w-3 text-blue-600" />} />
              <MiniStat label="Terjual" value={summary.totalSold} icon={<ShoppingBag className="h-3 w-3 text-emerald-600" />} />
              <MiniStat label="Dipesan" value={summary.totalOrdered} icon={<ShoppingCart className="h-3 w-3 text-amber-600" />} />
            </div>
          )}

          {/* Product list — table-like rows */}
          <div className="overflow-hidden rounded-2xl border border-surface-200/70 bg-white">
            {/* Header */}
            <div className="hidden border-b border-surface-200/70 bg-surface-50/50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-surface-500 sm:grid sm:grid-cols-[1fr_80px_80px_80px_80px]">
              <span>Produk</span>
              <span className="text-center">Views</span>
              <span className="text-center">Dipesan</span>
              <span className="text-center">Terjual</span>
              <span className="text-center">Konversi</span>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-surface-200/70">
              {products.map((product, idx) => (
                <ProductRow key={product.id} product={product} idx={idx} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </DashboardPanel>
  )
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-surface-200/70 bg-white px-3 py-2.5 text-center">
      <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-surface-500">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 text-[15px] font-black tabular-nums text-ink">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </p>
    </div>
  )
}

function ProductRow({ product, idx }: { product: ProductAnalytic; idx: number }) {
  // Visual bar width for views (relative to max in list — simplified to percentage of 100)
  const viewBarWidth = Math.min(100, Math.max(5, (product.views / Math.max(product.views, 1)) * 100))

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="group grid items-center gap-3 px-4 py-3 transition-colors hover:bg-primary-50/30 sm:grid-cols-[1fr_80px_80px_80px_80px]"
    >
      {/* Product identity */}
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-surface-100">
          {product.image ? (
            <img src={product.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-surface-400">
              <Package className="h-4 w-4" />
            </div>
          )}
          {!product.isPublished && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[7px] font-bold uppercase text-white">
              Draft
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-ink">{product.name}</p>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-surface-500">
            <span>{categoryLabel[product.category] ?? product.category}</span>
            <span className="text-surface-300">·</span>
            <span className="font-semibold tabular-nums text-primary-700">{formatPrice(product.price)}</span>
            <span className="text-surface-300">·</span>
            <span>Stok: {product.stock}</span>
          </div>
        </div>
      </div>

      {/* Views */}
      <div className="hidden text-center sm:block">
        <p className="text-[14px] font-bold tabular-nums text-ink">{product.views.toLocaleString('id-ID')}</p>
        <div className="mx-auto mt-1 h-[2px] w-12 overflow-hidden rounded-full bg-surface-200">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${viewBarWidth}%` }} />
        </div>
      </div>

      {/* Ordered */}
      <div className="hidden text-center sm:block">
        <p className="text-[14px] font-bold tabular-nums text-ink">{product.totalOrdered}</p>
      </div>

      {/* Sold */}
      <div className="hidden text-center sm:block">
        <p className="text-[14px] font-bold tabular-nums text-ink">{product.soldCount}</p>
      </div>

      {/* Conversion */}
      <div className="hidden text-center sm:block">
        <p className={cn(
          'text-[14px] font-bold tabular-nums',
          product.conversionRate >= 5 ? 'text-primary-700' : product.conversionRate >= 2 ? 'text-amber-700' : 'text-surface-600',
        )}>
          {product.conversionRate}%
        </p>
      </div>

      {/* Mobile stats row */}
      <div className="flex items-center gap-4 text-[11px] sm:hidden">
        <span className="inline-flex items-center gap-1 text-surface-600">
          <Eye className="h-3 w-3 text-blue-600" />
          {product.views}
        </span>
        <span className="inline-flex items-center gap-1 text-surface-600">
          <ShoppingCart className="h-3 w-3 text-amber-600" />
          {product.totalOrdered}
        </span>
        <span className="inline-flex items-center gap-1 text-surface-600">
          <ShoppingBag className="h-3 w-3 text-emerald-600" />
          {product.soldCount}
        </span>
        <span className="inline-flex items-center gap-1 font-bold text-primary-700">
          <TrendingUp className="h-3 w-3" />
          {product.conversionRate}%
        </span>
      </div>
    </motion.li>
  )
}
