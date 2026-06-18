'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BenchmarkResult, PillarScore, AttributeRow } from '@/lib/product-benchmark'
import { ArrowRight, Scales, Award, Check, X, Sparkles } from '@/lib/icons'

const ease = [0.22, 1, 0.36, 1] as const

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

type CompareProduct = {
  id: string
  name: string
  image: string | null
  price: number
  storeName: string
}

type CompareResponse = {
  productA: CompareProduct
  productB: CompareProduct
  result: BenchmarkResult
}

export function BenchmarkResultView({ idA, idB }: { idA: string; idB: string }) {
  const [data, setData] = useState<CompareResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/marketplace/compare?a=${idA}&b=${idB}`)
        const json = await res.json()
        if (!json.success) {
          setError(json.error ?? 'Gagal membandingkan produk')
          return
        }
        setData(json.data)
      } catch {
        setError('Gagal memuat perbandingan')
      } finally {
        setLoading(false)
      }
    })()
  }, [idA, idB])

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-surface-50 via-white to-primary-50/30">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pt-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-6 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary-700">
            <Scales className="h-3.5 w-3.5" weight="fill" />
            Benchmark Produk
          </div>
          <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
            Hasil Perbandingan
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Penilaian objektif berdasarkan kondisi, hardware, spesifikasi & kelengkapan.
          </p>
        </motion.div>

        {loading && (
          <div className="py-20 text-center text-sm text-surface-500">Menghitung skor...</div>
        )}

        {error && !loading && (
          <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-sm font-medium text-rose-700">{error}</p>
            <Link href="/marketplace" className="mt-4 inline-block">
              <Button variant="outline" size="sm">Kembali ke Marketplace</Button>
            </Link>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            <HeadToHead data={data} />
            <PillarBreakdown result={data.result} />
            <InsightCard result={data.result} />
            <AttributeTable result={data.result} nameA={data.productA.name} nameB={data.productB.name} />
            <ActionRow data={data} />
          </div>
        )}
      </main>

      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}

/* ---- Head to head: 2 kartu + skor total ---- */
function HeadToHead({ data }: { data: CompareResponse }) {
  const { productA, productB, result } = data

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <ProductScoreCard
        product={productA}
        total={result.totalA}
        isWinner={result.winner === 'A'}
        isTie={result.winner === 'TIE'}
        side="A"
        delay={0}
      />
      <ProductScoreCard
        product={productB}
        total={result.totalB}
        isWinner={result.winner === 'B'}
        isTie={result.winner === 'TIE'}
        side="B"
        delay={0.1}
      />
    </div>
  )
}

function ProductScoreCard({
  product,
  total,
  isWinner,
  isTie,
  side,
  delay,
}: {
  product: CompareProduct
  total: number
  isWinner: boolean
  isTie: boolean
  side: 'A' | 'B'
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-white p-3 shadow-soft-sm sm:p-4',
        isWinner ? 'border-primary-400 ring-2 ring-primary-200' : 'border-surface-200/70',
      )}
    >
      {isWinner && (
        <div className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-soft-xs">
          <Award className="h-3 w-3" weight="fill" />
          Unggul
        </div>
      )}
      <div className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-surface-400">
        Produk {side}
      </div>
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-surface-100">
        <img
          src={product.image ?? ''}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
      <h3 className="mt-2 line-clamp-2 text-[13px] font-bold leading-tight text-ink sm:text-sm">
        {product.name}
      </h3>
      <p className="mt-0.5 truncate text-[11px] text-surface-500">{product.storeName}</p>
      <p className="mt-1 text-sm font-black text-primary-700 sm:text-base">
        {formatPrice(product.price)}
      </p>

      {/* Skor total */}
      <div
        className={cn(
          'mt-3 rounded-xl p-2.5 text-center',
          isWinner
            ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white'
            : 'bg-surface-100 text-ink',
        )}
      >
        <p
          className={cn(
            'text-[9px] font-bold uppercase tracking-[0.16em]',
            isWinner ? 'text-primary-100' : 'text-surface-500',
          )}
        >
          Skor Total
        </p>
        <CountUp value={total} className="text-2xl font-black tabular-nums sm:text-3xl" />
      </div>
    </motion.div>
  )
}

/* ---- Pillar breakdown: progress bar berdampingan ---- */
function PillarBreakdown({ result }: { result: BenchmarkResult }) {
  const visible = result.pillars.filter((p) => !p.skipped)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease }}
      className="rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-sm sm:p-5"
    >
      <h2 className="mb-4 text-base font-bold text-ink">Breakdown per Kategori</h2>
      <div className="space-y-4">
        {visible.map((pillar, i) => (
          <PillarRow key={pillar.key} pillar={pillar} delay={i * 0.08} />
        ))}
      </div>
    </motion.div>
  )
}

function PillarRow({ pillar, delay }: { pillar: PillarScore; delay: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink">{pillar.label}</span>
        <span className="text-[10px] font-medium text-surface-400">
          bobot {Math.round(pillar.weight * 100)}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* A */}
        <div className="flex items-center gap-2">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-100">
            <motion.div
              className={cn(
                'h-full rounded-full',
                pillar.winner === 'A'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600'
                  : 'bg-surface-300',
              )}
              initial={{ width: 0 }}
              whileInView={{ width: `${pillar.scoreA}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay, ease }}
            />
          </div>
          <span
            className={cn(
              'w-8 text-right text-[11px] font-bold tabular-nums',
              pillar.winner === 'A' ? 'text-primary-700' : 'text-surface-500',
            )}
          >
            {pillar.scoreA}
          </span>
        </div>
        {/* B */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'w-8 text-[11px] font-bold tabular-nums',
              pillar.winner === 'B' ? 'text-primary-700' : 'text-surface-500',
            )}
          >
            {pillar.scoreB}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-100">
            <motion.div
              className={cn(
                'ml-auto h-full rounded-full',
                pillar.winner === 'B'
                  ? 'bg-gradient-to-l from-primary-500 to-primary-600'
                  : 'bg-surface-300',
              )}
              initial={{ width: 0 }}
              whileInView={{ width: `${pillar.scoreB}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay, ease }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Insight ---- */
function InsightCard({ result }: { result: BenchmarkResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease }}
      className="relative overflow-hidden rounded-2xl border border-primary-200/70 bg-gradient-to-br from-primary-50 via-white to-emerald-50/40 p-4 shadow-soft-sm sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-soft-xs">
          <Sparkles className="h-5 w-5" weight="fill" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-700">
            Insight
          </p>
          <p className="mt-1 text-sm leading-relaxed text-surface-700">{result.insight}</p>
        </div>
      </div>
      {result.hasIncompleteData && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700 ring-1 ring-inset ring-amber-200">
          ⚠️ Sebagian data kondisi/3uTools belum lengkap. Skor memakai nilai netral untuk data yang kosong.
        </p>
      )}
    </motion.div>
  )
}

/* ---- Attribute table ---- */
function AttributeTable({
  result,
  nameA,
  nameB,
}: {
  result: BenchmarkResult
  nameA: string
  nameB: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease }}
      className="overflow-hidden rounded-2xl border border-surface-200/70 bg-white shadow-soft-sm"
    >
      <div className="border-b border-surface-200/70 p-4">
        <h2 className="text-base font-bold text-ink">Detail Spesifikasi</h2>
      </div>
      <div className="divide-y divide-surface-100">
        {/* Header row */}
        <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-2 bg-surface-50/60 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-surface-500">
          <span>Atribut</span>
          <span className="truncate text-center">{nameA}</span>
          <span className="truncate text-center">{nameB}</span>
        </div>
        {result.attributes.map((row) => (
          <AttrRow key={row.label} row={row} />
        ))}
      </div>
    </motion.div>
  )
}

function AttrRow({ row }: { row: AttributeRow }) {
  return (
    <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-2 px-3 py-2.5 text-[12px]">
      <span className="font-medium text-surface-500">{row.label}</span>
      <span
        className={cn(
          'flex items-center justify-center gap-1 text-center font-semibold',
          row.winner === 'A' ? 'text-primary-700' : 'text-ink',
        )}
      >
        {row.winner === 'A' && <Check className="h-3 w-3 flex-shrink-0 text-primary-600" weight="bold" />}
        <span className="truncate">{row.valueA}</span>
      </span>
      <span
        className={cn(
          'flex items-center justify-center gap-1 text-center font-semibold',
          row.winner === 'B' ? 'text-primary-700' : 'text-ink',
        )}
      >
        {row.winner === 'B' && <Check className="h-3 w-3 flex-shrink-0 text-primary-600" weight="bold" />}
        <span className="truncate">{row.valueB}</span>
      </span>
    </div>
  )
}

/* ---- Actions ---- */
function ActionRow({ data }: { data: CompareResponse }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[data.productA, data.productB].map((p, i) => (
        <Link key={p.id} href={`/marketplace/${p.id}`}>
          <Button variant={i === 0 ? 'primary' : 'outline'} className="w-full">
            Lihat {i === 0 ? 'Produk A' : 'Produk B'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      ))}
    </div>
  )
}

/* ---- Count-up animation ---- */
function CountUp({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const duration = 1200
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(value * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className={className}>{display.toFixed(1)}</span>
}
