'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Eye, Plus, Search, Trash2 } from '@/lib/icons'
import { cn } from '@/lib/utils'

const produkSeed = [
  { id: '1', name: 'iPhone 13 Pro Max - Second', category: 'Handphone', price: 8500000, teknisi: 'TechSolution', status: 'approved', views: 2341 },
  { id: '2', name: 'Samsung S21 Ultra - Refurbished', category: 'Handphone', price: 5200000, teknisi: 'HandPhone Center', status: 'approved', views: 1890 },
  { id: '3', name: 'Unlock Tool Premium License', category: 'Software', price: 500000, teknisi: 'TechSolution', status: 'pending', views: 0 },
]

const categoryBadge: Record<string, string> = {
  Handphone: 'bg-primary-50 text-primary-700 ring-primary-200/70',
  Software: 'bg-violet-50 text-violet-700 ring-violet-200/70',
  Laptop: 'bg-accent-50 text-accent-700 ring-accent-200/70',
  Aksesoris: 'bg-amber-50 text-amber-700 ring-amber-200/70',
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

export function AdminServicesProdukPanel() {
  const [qProd, setQProd] = useState('')
  const [catProd, setCatProd] = useState('all')

  const filteredProd = produkSeed.filter((p) => {
    const okQ = p.name.toLowerCase().includes(qProd.toLowerCase())
    const okC = catProd === 'all' || p.category.toLowerCase() === catProd.toLowerCase()
    return okQ && okC
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button variant="primary" size="sm" className="h-9 self-start">
          <Plus className="h-3.5 w-3.5" />
          Tambah Produk
        </Button>
        <select
          value={catProd}
          onChange={(e) => setCatProd(e.target.value)}
          className="h-9 rounded-xl border border-surface-200/80 bg-white px-3 text-xs text-surface-700"
        >
          <option value="all">Semua Kategori</option>
          <option value="handphone">Handphone</option>
          <option value="software">Software</option>
          <option value="laptop">Laptop</option>
          <option value="aksesoris">Aksesoris</option>
        </select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input
            value={qProd}
            onChange={(e) => setQProd(e.target.value)}
            placeholder="Cari produk..."
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <p className="text-[12px] text-surface-500">{filteredProd.length} produk</p>

      {/* Product list — card-based for mobile */}
      <div className="space-y-2">
        {filteredProd.map((p, idx) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
              {/* Product info */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-[13px] font-semibold text-ink">{p.name}</p>
                  <Badge variant={p.status === 'approved' ? 'success' : 'warning'} className="text-[8px] px-1.5 py-0">
                    {p.status === 'approved' ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-surface-500">
                  <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-inset', categoryBadge[p.category] ?? categoryBadge.Handphone)}>
                    {p.category}
                  </span>
                  <span className="font-semibold text-primary-700 tabular-nums">{formatPrice(p.price)}</span>
                  <span>·</span>
                  <span>{p.teknisi}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{p.views.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-shrink-0 gap-1">
                <Link href={`/marketplace/${p.id}`}>
                  <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </Link>
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProd.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
          <p className="text-sm font-semibold text-ink">Tidak ada produk</p>
          <p className="mt-1 text-xs text-surface-500">Coba ubah filter atau tambah produk baru.</p>
        </div>
      )}
    </div>
  )
}
