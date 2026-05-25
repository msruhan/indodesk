'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { SectionTabs } from '@/components/mobile/section-tabs'
import { buildMarketplaceTabs } from '@/lib/section-tab-config'
import { useAuth } from '@/contexts/auth-context'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FlashSaleRail } from '@/components/topup/hub/flash-sale-rail'
import { PopularRail } from '@/components/topup/hub/popular-rail'
import { CategoryTabs } from '@/components/topup/hub/category-tabs'
import { ProductCard } from '@/components/topup/hub/product-card'
import {
  CheckCircle,
  Clock,
  FileText,
  Search,
  Shield,
  Zap,
} from '@/lib/icons'
import { useTopupCatalog } from '@/contexts/topup-catalog-context'
import type { TopupCategorySlug } from '@/data/topup-types'

export default function TopupHubPage() {
  const { user } = useAuth()
  const { flags } = useFeatureFlags()
  const tabs = buildMarketplaceTabs(
    (user?.role as 'ADMIN' | 'TEKNISI' | 'USER' | undefined) ?? null,
    flags,
  )
  const { products, loading } = useTopupCatalog()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<TopupCategorySlug | 'all'>('all')

  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 400], [0, -50])
  const heroFade = useTransform(scrollY, [0, 300], [1, 0.85])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery =
        !query.trim() ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.publisher.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory
      return matchesQuery && matchesCategory
    })
  }, [products, query, activeCategory])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-surface-50 via-white to-primary-50/20">
      {/* Animated background — light gaming */}
      <LightGameAmbient />

      <div className="hidden lg:block">
        <Navbar />
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden lg:pt-28">
        <SectionTabs tabs={tabs} layoutId="marketplace-section-tab" variant="merged" />

        <motion.div
          style={{ y: heroY, opacity: heroFade }}
          className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-12 lg:px-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            {/* Left — Title + search */}
            <div>
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-200/70 bg-gradient-to-r from-fuchsia-50 to-pink-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-fuchsia-700 shadow-soft-xs">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
                  </span>
                  Live · 24/7
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="mt-4 text-balance text-[34px] font-black leading-[0.95] tracking-tight text-ink sm:text-5xl lg:text-[58px]"
              >
                Top up game
                <span className="block">
                  <span className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-600 bg-clip-text text-transparent">
                    instan & aman
                  </span>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 max-w-xl text-pretty text-[14px] leading-relaxed text-surface-600 sm:text-[15px]"
              >
                Mobile Legends, Free Fire, PUBG, Genshin, pulsa, paket data, voucher streaming.
                Diamond masuk dalam 1 menit, dijamin atau saldo kembali.
              </motion.p>

              {/* Trust pills */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-5 flex flex-wrap gap-1.5"
              >
                {[
                  { icon: Zap, label: 'Proses 1 menit', tone: 'fuchsia' },
                  { icon: Shield, label: 'Pembayaran aman', tone: 'cyan' },
                  { icon: Clock, label: 'CS 24 jam', tone: 'emerald' },
                  { icon: CheckCircle, label: 'Auto-refund jika gagal', tone: 'amber' },
                ].map((item, idx) => (
                  <NeonChip key={idx} icon={item.icon} label={item.label} tone={item.tone} />
                ))}
              </motion.div>

              {/* Search */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <div className="relative">
                  {/* Glow ring on focus */}
                  <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-fuchsia-500/30 via-violet-500/30 to-cyan-500/30 opacity-0 blur transition-opacity focus-within:opacity-100" />
                  <div className="relative flex items-center gap-2 rounded-2xl border border-surface-200/70 bg-white p-1.5 shadow-soft-sm">
                    <div className="relative flex-1">
                      <Search className={cn(searchInputIconClass, 'left-4 text-surface-400')} strokeWidth={2} aria-hidden />
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        type="text"
                        placeholder="Cari game, pulsa, voucher…"
                        className="h-11 border-none bg-transparent pl-11 text-ink placeholder:text-surface-400 focus:ring-0"
                      />
                    </div>
                    <Link href="/topup/cek-transaksi">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 px-4 text-[12px] font-bold"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Cek transaksi
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right — floating game preview cards */}
            <FloatingGameCards />
          </div>

          {/* Live ticker */}
          <LiveTicker className="mt-8 sm:mt-12" />
        </motion.div>
      </section>

      <main className="relative mx-auto max-w-7xl space-y-10 px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        {/* Flash sale */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
        >
          <FlashSaleRail />
        </motion.section>

        {/* Popular */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
        >
          <PopularRail />
        </motion.section>

        {/* Catalog */}
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-fuchsia-700">
                Etalase Gaming
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                Pilih game / produk
              </h2>
              <p className="mt-1 text-[12px] text-surface-500">
                <span className="font-bold tabular-nums text-ink">{filtered.length}</span> produk · auto-process 24/7
              </p>
            </div>
          </div>

          <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((p, idx) => (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: Math.min(idx * 0.04, 0.3) }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>

          {!loading && filtered.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-surface-300 bg-white px-6 py-10 text-center">
              <Search className="mx-auto h-6 w-6 text-surface-400" strokeWidth={2} aria-hidden />
              <p className="mt-3 text-sm font-semibold text-ink">Produk tidak ditemukan</p>
              <p className="mt-1 text-xs text-surface-500">Coba kata kunci lain atau ubah kategori.</p>
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

/* ============================================================================
   LIGHT GAME AMBIENT — soft pastel orbs + grid pattern
   ========================================================================== */
function LightGameAmbient() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[800px] overflow-hidden">
      {/* Soft pastel mesh blobs — confined to hero area */}
      <motion.div
        className="absolute -left-40 top-20 h-[28rem] w-[28rem] rounded-full bg-fuchsia-200/30 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-40 top-32 h-[28rem] w-[28rem] rounded-full bg-cyan-200/30 blur-[120px]"
        animate={{ x: [0, -60, 0], y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2 top-40 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-200/25 blur-[100px]"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle pixel grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating colored particles */}
      <FloatingParticles />
    </div>
  )
}

function FloatingParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => i)
  return (
    <>
      {particles.map((i) => {
        const left = (i * 37) % 100
        const top = (i * 53) % 100
        const duration = 8 + (i % 5) * 2
        const delay = (i * 0.5) % 6
        const size = i % 3 === 0 ? 4 : i % 3 === 1 ? 3 : 2
        const palette = i % 3 === 0
          ? 'bg-fuchsia-400/70'
          : i % 3 === 1
            ? 'bg-cyan-400/70'
            : 'bg-violet-400/70'
        return (
          <motion.span
            key={i}
            className={cn('absolute rounded-full', palette)}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              boxShadow: '0 0 12px currentColor',
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: 'easeInOut',
            }}
          />
        )
      })}
    </>
  )
}

/* ============================================================================
   NEON CHIP — light variant with subtle glow
   ========================================================================== */
function NeonChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Zap
  label: string
  tone: string
}) {
  const palette: Record<string, { border: string; bg: string; text: string; glow: string }> = {
    fuchsia: {
      border: 'border-fuchsia-200/80',
      bg: 'bg-gradient-to-br from-fuchsia-50 to-pink-50/50',
      text: 'text-fuchsia-700',
      glow: 'shadow-[0_2px_10px_-2px_rgba(217,70,239,0.2)]',
    },
    cyan: {
      border: 'border-cyan-200/80',
      bg: 'bg-gradient-to-br from-cyan-50 to-sky-50/50',
      text: 'text-cyan-700',
      glow: 'shadow-[0_2px_10px_-2px_rgba(6,182,212,0.2)]',
    },
    emerald: {
      border: 'border-emerald-200/80',
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50/50',
      text: 'text-emerald-700',
      glow: 'shadow-[0_2px_10px_-2px_rgba(16,185,129,0.2)]',
    },
    amber: {
      border: 'border-amber-200/80',
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50/50',
      text: 'text-amber-700',
      glow: 'shadow-[0_2px_10px_-2px_rgba(245,158,11,0.2)]',
    },
  }
  const c = palette[tone] ?? palette.fuchsia

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition-all hover:-translate-y-0.5',
        c.border,
        c.bg,
        c.text,
        c.glow,
      )}
    >
      <Icon className="h-3 w-3" weight="fill" />
      {label}
    </span>
  )
}

/* ============================================================================
   FLOATING GAME CARDS — parallax 3D hero (light variant)
   ========================================================================== */
function FloatingGameCards() {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const sx = useSpring(mouseX, { stiffness: 80, damping: 16 })
  const sy = useSpring(mouseY, { stiffness: 80, damping: 16 })

  const cards = [
    {
      title: 'Mobile Legends',
      label: '500 Diamonds',
      price: 'Rp 122k',
      cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop',
      tone: 'from-fuchsia-500/30 to-purple-600/20',
      ring: 'ring-fuchsia-300/60',
      glow: 'shadow-[0_12px_40px_-12px_rgba(217,70,239,0.4)]',
      x: '0%',
      y: '0%',
      rotate: -6,
      delay: 0,
      parallax: 1,
    },
    {
      title: 'Free Fire',
      label: '210 Diamonds',
      price: 'Rp 33k',
      cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=400&fit=crop',
      tone: 'from-orange-500/30 to-red-600/20',
      ring: 'ring-orange-300/60',
      glow: 'shadow-[0_12px_40px_-12px_rgba(249,115,22,0.4)]',
      x: '55%',
      y: '8%',
      rotate: 8,
      delay: 0.15,
      parallax: 1.5,
    },
    {
      title: 'Genshin Impact',
      label: 'Genesis x60',
      price: 'Rp 16k',
      cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop',
      tone: 'from-cyan-500/30 to-blue-600/20',
      ring: 'ring-cyan-300/60',
      glow: 'shadow-[0_12px_40px_-12px_rgba(34,211,238,0.4)]',
      x: '20%',
      y: '60%',
      rotate: -3,
      delay: 0.3,
      parallax: 0.7,
    },
  ]

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        const px = (e.clientX - rect.left) / rect.width - 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5
        mouseX.set(px)
        mouseY.set(py)
      }}
      onMouseLeave={() => {
        mouseX.set(0)
        mouseY.set(0)
      }}
      className="relative hidden h-[380px] lg:block"
    >
      {cards.map((card, idx) => (
        <FloatingCard key={idx} card={card} mouseX={sx} mouseY={sy} />
      ))}

      {/* Decorative orbital rings */}
      <motion.div
        className="pointer-events-none absolute inset-12 rounded-full border border-fuchsia-300/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.7)]" />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute inset-20 rounded-full border border-cyan-300/30"
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      >
        <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
      </motion.div>
    </div>
  )
}

function FloatingCard({
  card,
  mouseX,
  mouseY,
}: {
  card: {
    title: string
    label: string
    price: string
    cover: string
    tone: string
    ring: string
    glow: string
    x: string
    y: string
    rotate: number
    delay: number
    parallax: number
  }
  mouseX: ReturnType<typeof useSpring>
  mouseY: ReturnType<typeof useSpring>
}) {
  const tx = useTransform(mouseX, (v) => v * 30 * card.parallax)
  const ty = useTransform(mouseY, (v) => v * 20 * card.parallax)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, rotate: card.rotate - 10 }}
      animate={{ opacity: 1, scale: 1, rotate: card.rotate }}
      transition={{ duration: 0.7, delay: card.delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        x: tx,
        y: ty,
        left: card.x,
        top: card.y,
      }}
      className="absolute"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4 + card.parallax, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
        className={cn(
          'relative w-44 overflow-hidden rounded-2xl border border-white bg-white ring-2 ring-inset',
          card.ring,
          card.glow,
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={card.cover} alt="" className="h-full w-full object-cover" />
          <div className={cn('absolute inset-0 bg-gradient-to-br', card.tone)} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/80">
              {card.label}
            </p>
            <p className="text-[12.5px] font-black tracking-tight text-white drop-shadow">
              {card.title}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white px-2.5 py-1.5">
          <span className="text-[8.5px] font-bold uppercase tracking-[0.16em] text-surface-500">
            Mulai dari
          </span>
          <span className="font-mono text-[12px] font-black tabular-nums text-ink">
            {card.price}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ============================================================================
   LIVE TICKER — light variant, fake live order feed
   ========================================================================== */
function LiveTicker({ className }: { className?: string }) {
  const items = [
    { game: 'Mobile Legends', detail: '500 Diamonds', user: '+62 81***123', time: 'Baru saja' },
    { game: 'Free Fire', detail: '210 Diamonds', user: '+62 87***887', time: '12 detik' },
    { game: 'PUBG Mobile', detail: '660 UC', user: '+62 89***445', time: '23 detik' },
    { game: 'Genshin', detail: 'Welkin Moon', user: '+62 81***002', time: '1 menit' },
    { game: 'Honor of Kings', detail: '300 Tokens', user: '+62 85***117', time: '2 menit' },
    { game: 'Telkomsel', detail: 'Pulsa Rp 50k', user: '+62 81***331', time: '3 menit' },
    { game: 'Spotify', detail: '1 Bulan', user: '+62 89***992', time: '4 menit' },
  ]

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-surface-200/70 bg-white/80 backdrop-blur-md shadow-soft-xs', className)}>
      {/* Live indicator */}
      <div className="absolute left-3 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-[0_2px_10px_-2px_rgba(16,185,129,0.5)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        Live
      </div>

      {/* Fade gradient on right only — left side cleared for LIVE badge */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white via-white/80 to-transparent" />

      {/* Ticker track */}
      <motion.div
        className="flex gap-4 py-3 pl-24 pr-6"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
      >
        {[...items, ...items].map((item, idx) => (
          <div
            key={idx}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-surface-200/70 bg-surface-50/70 px-3 py-1.5 text-[11px]"
          >
            <Zap className="h-3 w-3 text-emerald-600" weight="fill" />
            <span className="font-bold text-ink">{item.game}</span>
            <span className="text-surface-300">·</span>
            <span className="text-surface-700">{item.detail}</span>
            <span className="text-surface-300">·</span>
            <span className="font-mono text-[10px] text-surface-500">{item.user}</span>
            <span className="text-surface-300">·</span>
            <span className="font-mono text-[9.5px] text-emerald-700">{item.time}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
