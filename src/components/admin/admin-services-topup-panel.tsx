'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Eye, Plus, Search, Trash2, Zap } from '@/lib/icons'
import { topupProducts, topupCategories, topupDenominations } from '@/data/mock-topup'
import { cn } from '@/lib/utils'

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

export function AdminServicesTopupPanel() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')

  const rows = useMemo(
    () =>
      topupProducts.map((p, i) => ({
        id: String(i + 1),
        slug: p.slug,
        name: p.name,
        publisher: p.publisher,
        category: topupCategories.find((c) => c.slug === p.category)?.label ?? p.category,
        minPrice: (() => {
          const prices = topupDenominations
            .filter((d) => d.productSlug === p.slug)
            .map((d) => d.salePrice ?? d.basePrice)
          return prices.length > 0 ? Math.min(...prices) : 0
        })(),
        status: i % 5 === 0 ? ('inactive' as const) : ('active' as const),
        orders: 1200 - i * 87,
      })),
    [],
  )

  const filtered = rows.filter((r) => {
    const okQ = !q.trim() || r.name.toLowerCase().includes(q.toLowerCase()) || r.publisher.toLowerCase().includes(q.toLowerCase())
    const okC = cat === 'all' || r.category.toLowerCase().includes(cat.toLowerCase())
    return okQ && okC
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button variant="primary" size="sm" className="h-9 self-start">
          <Plus className="h-3.5 w-3.5" />
          Tambah Topup
        </Button>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="h-9 rounded-xl border border-surface-200/80 bg-white px-3 text-xs text-surface-700"
        >
          <option value="all">Semua Kategori</option>
          {topupCategories.map((c) => (
            <option key={c.slug} value={c.label}>{c.label}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari produk topup..." className="h-9 pl-9 text-xs" />
        </div>
      </div>

      <p className="text-[12px] text-surface-500">{filtered.length} produk topup</p>

      {/* Card list */}
      <div className="space-y-2">
        {filtered.map((r, idx) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
            <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <p className="truncate text-[13px] font-semibold text-ink">{r.name}</p>
                  <Badge variant={r.status === 'active' ? 'success' : 'default'} className="text-[8px] px-1.5 py-0">
                    {r.status === 'active' ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-surface-500">
                  <span>{r.publisher}</span>
                  <span>·</span>
                  <Badge variant="info" className="text-[8px] px-1 py-0">{r.category}</Badge>
                  <span>·</span>
                  <span className="font-semibold text-primary-700 tabular-nums">{formatPrice(r.minPrice)}</span>
                  <span>·</span>
                  <span>{r.orders.toLocaleString()} order</span>
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-1">
                <Link href={`/topup/${r.slug}`}>
                  <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink"><Eye className="h-3.5 w-3.5" /></button>
                </Link>
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink"><Edit className="h-3.5 w-3.5" /></button>
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
