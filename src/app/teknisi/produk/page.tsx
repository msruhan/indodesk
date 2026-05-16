'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DashboardPageHeader,
  DashboardPanel,
  DataToolbar,
  EmptyState,
  MetricCard,
  StatusBadge,
} from '@/components/dashboard'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  CheckCircle,
  Clock,
  ArrowRight,
  ShoppingCart,
} from '@/lib/icons'
import { cn } from '@/lib/utils'

type ProdukStatus = 'approved' | 'pending'

type ProdukItem = {
  id: string
  name: string
  category: string
  price: number
  status: ProdukStatus
  views: number
  sold: number
  createdAt: string
  image: string
}

const produk: ProdukItem[] = [
  {
    id: '1',
    name: 'iPhone 13 Pro Max - Second',
    category: 'Handphone',
    price: 8_500_000,
    status: 'approved',
    views: 2341,
    sold: 12,
    createdAt: '2024-03-15',
    image:
      'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=400&fit=crop',
  },
  {
    id: '2',
    name: 'Samsung S21 Ultra - Refurbished',
    category: 'Handphone',
    price: 5_200_000,
    status: 'approved',
    views: 1890,
    sold: 8,
    createdAt: '2024-03-14',
    image:
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop',
  },
  {
    id: '3',
    name: 'Unlock Tool Premium License',
    category: 'Software',
    price: 500_000,
    status: 'pending',
    views: 0,
    sold: 0,
    createdAt: '2024-03-20',
    image:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop',
  },
]

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)

const categoryTone: Record<string, string> = {
  Handphone: 'border-primary-200/50 bg-primary-50/80 text-primary-800',
  Software: 'border-accent-200/50 bg-accent-50/80 text-accent-800',
  Laptop: 'border-surface-200/70 bg-surface-100 text-surface-700',
  Aksesoris: 'border-amber-200/50 bg-amber-50/80 text-amber-800',
}

export default function TeknisiProdukPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const filteredProduk = useMemo(
    () =>
      produk.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery],
  )

  const totalViews = produk.reduce((sum, p) => sum + p.views, 0)
  const totalSold = produk.reduce((sum, p) => sum + p.sold, 0)
  const approvedCount = produk.filter((p) => p.status === 'approved').length
  const pendingCount = produk.filter((p) => p.status === 'pending').length

  return (
    <motion.div
      className="space-y-6 pb-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <DashboardPageHeader
        title="Produk & Software"
        description="Kelola produk dan software yang Anda jual di marketplace IndoTeknizi."
        actions={
          <Button
            variant="primary"
            size="sm"
            className="h-8 gap-1 self-start px-3 text-[11px]"
            onClick={() => setShowAddForm((open) => !open)}
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Produk
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary-200/70 bg-primary-50 px-2.5 py-1 font-medium text-primary-800">
              <CheckCircle className="h-3.5 w-3.5 text-primary-600" />
              {approvedCount} aktif
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
                <Clock className="h-3.5 w-3.5" />
                {pendingCount} menunggu review
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Package className="h-3.5 w-3.5 text-primary-600" />
              Tampil di marketplace
            </span>
          </div>
        }
      />

      {showAddForm && (
        <DashboardPanel
          title="Tambah Produk Baru"
          description="Lengkapi detail produk. Iklan akan direview sebelum tampil di marketplace."
        >
          <form className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">
                  Nama Produk
                </label>
                <Input placeholder="Contoh: iPhone 13 Pro Max" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">
                  Kategori
                </label>
                <select className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink shadow-soft-xs focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50">
                  <option>Handphone</option>
                  <option>Laptop</option>
                  <option>Aksesoris</option>
                  <option>Software</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">
                  Harga (Rp)
                </label>
                <Input type="number" placeholder="8500000" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">
                  Foto Produk
                </label>
                <Input type="file" accept="image/*" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-surface-700">
                Deskripsi
              </label>
              <textarea
                className="w-full resize-none rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm shadow-soft-xs focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50"
                rows={4}
                placeholder="Deskripsi lengkap produk..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit">Simpan</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Batal
              </Button>
            </div>
          </form>
        </DashboardPanel>
      )}

      <motion.div className="grid grid-cols-2 gap-3">
        <MetricCard
          title="Total Iklan"
          value={String(produk.length)}
          footnote={`${filteredProduk.length} ditampilkan`}
          icon={Package}
          tone="primary"
          compact
        />
        <MetricCard
          title="Total Terjual"
          value={totalSold.toLocaleString('id-ID')}
          footnote="Semua waktu"
          icon={ShoppingCart}
          tone="primary"
          compact
        />
        <MetricCard
          title="Total Dilihat"
          value={totalViews.toLocaleString('id-ID')}
          footnote="30 hari terakhir"
          icon={Eye}
          tone="primary"
          compact
        />
        <MetricCard
          title="Menunggu Review"
          value={String(pendingCount)}
          footnote={pendingCount > 0 ? 'Perlu persetujuan admin' : 'Semua sudah aktif'}
          icon={Clock}
          tone={pendingCount > 0 ? 'warning' : 'neutral'}
          compact
        />
      </motion.div>

      <DataToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Cari produk..."
        resultLabel={`${filteredProduk.length} produk`}
      />

      {filteredProduk.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Produk tidak ditemukan"
          description="Coba kata kunci lain atau tambah iklan produk baru."
          action={
            <Button variant="primary" onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Produk
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredProduk.map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Card className="overflow-hidden transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-soft-md">
                <CardContent className="flex items-stretch gap-3 p-3">
                  {/* Compact square thumbnail */}
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-surface-100 sm:h-28 sm:w-28">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-1.5 top-1.5">
                      <StatusBadge status={p.status} />
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full px-2 py-0 text-[9px] font-medium',
                            categoryTone[p.category] ?? categoryTone.Handphone,
                          )}
                        >
                          {p.category}
                        </Badge>
                      </div>
                      <h3 className="line-clamp-1 text-[13px] font-semibold text-ink">
                        {p.name}
                      </h3>
                      <p className="mt-0.5 text-[14px] font-bold text-primary-700">
                        {formatPrice(p.price)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-[10px] text-surface-500">
                        <span className="inline-flex items-center gap-0.5">
                          <Eye className="h-3 w-3" />
                          {p.views.toLocaleString('id-ID')}
                        </span>
                        <span>·</span>
                        <span>{p.createdAt}</span>
                      </p>
                    </div>

                    {/* Actions — compact row */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <Link href={`/marketplace/${p.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="h-7 w-full gap-1 px-2 text-[10px]">
                          <ArrowRight className="h-3 w-3" />
                          Publik
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-[10px]">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div
        className={cn(
          'flex flex-col gap-2 rounded-2xl border border-dashed border-surface-200/80 bg-white/60 p-4 sm:flex-row sm:items-center sm:justify-between',
        )}
      >
        <p className="text-xs leading-relaxed text-surface-500">
          Produk dengan foto jelas dan deskripsi lengkap mendapat 2× lebih banyak views di
          marketplace.
        </p>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 self-start sm:self-auto">
          <Edit className="h-3.5 w-3.5" />
          Tips optimasi iklan
        </Button>
      </div>
    </motion.div>
  )
}
