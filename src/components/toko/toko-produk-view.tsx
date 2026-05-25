'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { cn } from '@/lib/utils'
import type { PublicStoreProductDto } from '@/lib/teknisi-store-serializer'
import {
  ArrowRight,
  ChevronLeft,
  Search,
  Store,
} from '@/lib/icons'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

const categoryLabel: Record<string, string> = {
  HANDPHONE: 'Handphone',
  LAPTOP: 'Laptop',
  AKSESORIS: 'Aksesoris',
  SOFTWARE: 'Software',
  LAINNYA: 'Lainnya',
}

const ease = [0.22, 1, 0.36, 1] as const

type StoreSummary = {
  id: string
  name: string
  coverImage: string | null
  city: string | null
}

type Props = { storeId: string }

export function TokoProdukView({ storeId }: Props) {
  const [store, setStore] = useState<StoreSummary | null>(null)
  const [products, setProducts] = useState<PublicStoreProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')

  const debouncedSearch = useDebouncedValue(search, 300)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const url = new URL(`/api/stores/${storeId}/products`, window.location.origin)
        if (debouncedSearch) url.searchParams.set('q', debouncedSearch)
        if (category !== 'all') url.searchParams.set('category', category)

        const res = await fetch(url.toString())
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Gagal memuat produk toko')
          setStore(null)
          setProducts([])
          return
        }
        setStore(json.data.store)
        setProducts(json.data.products)
      } catch {
        if (!cancelled) setError('Gagal memuat produk toko')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [storeId, debouncedSearch, category])

  const categories = useMemo(() => {
    const set = new Set<string>(['all'])
    products.forEach((p) => set.add(p.category))
    return Array.from(set)
  }, [products])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-surface-50 via-white to-primary-50/30">
      <div className="hidden lg:block"><Navbar /></div>

      <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-16 lg:pt-28">
        {/* Back */}
        <Link
          href={`/toko/${storeId}`}
          className="inline-flex items-center gap-1 rounded-full border border-surface-200/70 bg-white/80 px-3.5 py-1.5 text-[12px] font-semibold text-surface-700 shadow-soft-xs backdrop-blur-md transition-colors hover:border-primary-200 hover:text-primary-700"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Kembali ke profil toko
        </Link>

        {loading && !store && (
          <div className="mt-8 grid gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-surface-100" />
            ))}
          </div>
        )}

        {error && !loading && (
          <Card className="mx-auto mt-12 max-w-md">
            <CardContent className="py-10 text-center">
              <Store className="mx-auto mb-3 h-8 w-8 text-surface-400" />
              <p className="text-sm font-medium text-ink">{error}</p>
            </CardContent>
          </Card>
        )}

        {store && (
          <>
            {/* Header — store identity strip */}
            <motion.header
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="mt-5 flex items-center gap-4"
            >
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-surface-100 sm:h-16 sm:w-16">
                {store.coverImage ? (
                  <img src={store.coverImage} alt={store.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-emerald-600 text-white">
                    <Store className="h-6 w-6" weight="fill" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-700">
                  Etalase Lengkap
                </p>
                <h1 className="mt-0.5 truncate text-2xl font-black tracking-tight text-ink sm:text-3xl">
                  {store.name}
                </h1>
                {store.city && (
                  <p className="mt-0.5 text-[12px] text-surface-500">{store.city}</p>
                )}
              </div>
              <div className="hidden text-right sm:block">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface-400">
                  Total
                </p>
                <p className="text-2xl font-black tabular-nums text-ink">{products.length}</p>
              </div>
            </motion.header>

            {/* Toolbar — search + categories */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.55, ease }}
              className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari produk di toko ini..."
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors',
                      category === cat
                        ? 'border-primary-600 bg-primary-600 text-white shadow-soft-xs'
                        : 'border-surface-200/70 bg-white text-surface-600 hover:border-primary-200 hover:text-primary-700',
                    )}
                  >
                    {cat === 'all' ? 'Semua' : categoryLabel[cat] ?? cat}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Products grid */}
            {!loading && products.length === 0 && (
              <Card className="mt-12">
                <CardContent className="py-14 text-center">
                  <Store className="mx-auto mb-3 h-10 w-10 text-surface-400" />
                  <p className="text-sm font-medium text-ink">Tidak ada produk yang cocok.</p>
                  <p className="mt-1 text-[12px] text-surface-500">
                    Coba ubah kata kunci pencarian atau filter kategori.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSearch('')
                      setCategory('all')
                    }}
                  >
                    Reset filter
                  </Button>
                </CardContent>
              </Card>
            )}

            {products.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product, idx) => (
                  <ProductCard key={product.id} product={product} idx={idx} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="lg:hidden">
        <BottomNav />
        <MobileSafeAreaSpacer />
      </div>
    </div>
  )
}

function ProductCard({ product, idx }: { product: PublicStoreProductDto; idx: number }) {
  return (
    <Link href={`/marketplace/${product.id}`} className="group block">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{ delay: Math.min(idx * 0.04, 0.5) }}
        whileHover={{ y: -3 }}
        className="overflow-hidden rounded-2xl border border-surface-200/70 bg-white shadow-soft-xs transition-shadow hover:shadow-soft-md"
      >
        <div className="relative aspect-square overflow-hidden bg-surface-100">
          <motion.img
            src={
              product.image ??
              'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop'
            }
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
            whileHover={{ scale: 1.07 }}
            transition={{ duration: 0.5 }}
          />
          <div className="absolute inset-x-2 bottom-2 inline-flex items-center justify-center rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-ink opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            Lihat detail
            <ArrowRight className="ml-1 h-3 w-3" />
          </div>
        </div>
        <div className="p-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary-700">
            {categoryLabel[product.category] ?? product.category}
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] font-bold leading-snug text-ink">{product.name}</p>
          <p className="mt-2 text-[14px] font-black tabular-nums text-primary-700">
            {formatPrice(product.price)}
          </p>
        </div>
      </motion.div>
    </Link>
  )
}
