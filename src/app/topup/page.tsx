'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TrustStrip } from '@/components/topup/shared/trust-strip'
import { FlashSaleRail } from '@/components/topup/hub/flash-sale-rail'
import { PopularRail } from '@/components/topup/hub/popular-rail'
import { CategoryTabs } from '@/components/topup/hub/category-tabs'
import { ProductCard } from '@/components/topup/hub/product-card'
import { Reveal, AuroraBackground } from '@/components/motion'
import { Search, Sparkles, ArrowRight, FileText } from '@/lib/icons'
import { topupProducts } from '@/data/mock-topup'
import type { TopupCategorySlug } from '@/data/topup-types'

export default function TopupHubPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<TopupCategorySlug | 'all'>('all')

  const filtered = useMemo(() => {
    return topupProducts.filter((p) => {
      const matchesQuery =
        !query.trim() ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.publisher.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory
      return matchesQuery && matchesCategory
    })
  }, [query, activeCategory])

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden pb-6 pt-6 sm:pt-10 lg:pt-28">
        <AuroraBackground intensity="subtle" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal noBlur>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200/60 bg-primary-50/70 px-3 py-1 text-[11px] font-medium text-primary-700 backdrop-blur-md">
                  <Sparkles className="h-3 w-3" />
                  Top up & voucher digital
                </span>
                <h1 className="mt-3 text-balance text-[28px] font-semibold leading-[1.05] tracking-tightest text-ink sm:text-4xl lg:text-[44px]">
                  Top up game & voucher,
                  <span className="block">
                    <span className="gradient-text-static">cepat 1 menit</span> & aman.
                  </span>
                </h1>
                <p className="mt-3 max-w-xl text-pretty text-sm text-surface-600 sm:text-base">
                  Mobile Legends, Free Fire, PUBG, Genshin, pulsa, paket data, sampai voucher streaming.
                  Proses otomatis 24 jam, dijamin masuk atau saldo kembali.
                </p>
              </div>
              <Link
                href="/topup/cek-transaksi"
                className="inline-flex items-center gap-2 self-start rounded-full border border-surface-200/70 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-surface-700 backdrop-blur-md transition-colors hover:border-surface-300 hover:text-ink sm:self-auto"
              >
                <FileText className="h-3.5 w-3.5 text-primary-600" />
                Cek transaksi
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Reveal>

          {/* Search bar */}
          <Reveal noBlur delay={0.05}>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Cari game, pulsa, voucher…"
                  className="h-11 pl-11"
                />
              </div>
              <TrustStrip compact className="hidden sm:flex" />
            </div>
            <TrustStrip compact className="mt-3 sm:hidden" />
          </Reveal>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-7 px-4 pb-6 sm:space-y-9 sm:px-6 lg:px-8">
        {/* Flash sale */}
        <Reveal noBlur>
          <FlashSaleRail />
        </Reveal>

        {/* Popular */}
        <Reveal noBlur>
          <PopularRail />
        </Reveal>

        {/* Catalog */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-ink sm:text-base">
                Pilih game / produk
              </h2>
              <p className="text-[10px] text-surface-500">
                {filtered.length} produk · auto-process 24/7
              </p>
            </div>
          </div>
          <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((p, idx) => (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: Math.min(idx * 0.03, 0.2) }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
              <Search className="mx-auto h-6 w-6 text-surface-400" />
              <p className="mt-3 text-sm font-semibold text-ink">Produk tidak ditemukan</p>
              <p className="mt-1 text-xs text-surface-500">
                Coba kata kunci lain atau ubah kategori.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setQuery('')
                  setActiveCategory('all')
                }}
              >
                Reset filter
              </Button>
            </div>
          )}
        </section>
      </main>

      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
