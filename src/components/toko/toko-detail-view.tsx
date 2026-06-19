'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useTransform,
  animate,
  type MotionValue,
} from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { cn } from '@/lib/utils'
import type { PublicStoreDetailDto, PublicStoreProductDto } from '@/lib/teknisi-store-serializer'
import { categoryLabel } from '@/lib/product-category-config'
import type { StoreJourneyIcon, StoreJourneyMilestone } from '@/lib/store-content'
import { summarizeOperatingHours } from '@/lib/store-operating-hours'
import {
  ArrowRight,
  Award,
  CheckCircle,
  ChevronLeft,
  Clock,
  Eye,
  Heart,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tiktok,
  User,
  Wrench,
  X,
} from '@/lib/icons'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

const compactNumber = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : n.toLocaleString('id-ID')

const ease = [0.22, 1, 0.36, 1] as const
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }

type Props = { storeId: string }

export function TokoDetailView({ storeId }: Props) {
  const [store, setStore] = useState<PublicStoreDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)

  const { scrollY } = useScroll()
  const heroParallaxY = useTransform(scrollY, [0, 400], [0, -80])
  const heroFade = useTransform(scrollY, [0, 300], [1, 0.7])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/stores/${storeId}`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Toko tidak ditemukan')
          setStore(null)
          return
        }
        setStore(json.data)
      } catch {
        if (!cancelled) setError('Gagal memuat toko')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [storeId])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-100">
      <AmbientOrbs />
      <div className="hidden lg:block"><Navbar /></div>

      {loading && <LoadingShell />}

      {error && !loading && (
        <div className="mx-auto max-w-md px-4 pt-32">
          <Card>
            <CardContent className="py-10 text-center">
              <Store className="mx-auto mb-3 h-8 w-8 text-surface-400" />
              <p className="text-sm font-medium text-ink">{error}</p>
              <Link href="/toko" className="mt-4 inline-block text-sm text-amber-700 hover:underline">
                Lihat toko lain
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {store && !loading && (
        <>
          <CinematicHero
            store={store}
            liked={liked}
            onLikeToggle={() => setLiked((v) => !v)}
            heroY={heroParallaxY}
            heroOpacity={heroFade}
          />

          {/* MAIN CONTENT */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="relative mx-auto max-w-6xl space-y-12 px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-16"
          >
            <motion.div variants={fadeUp}>
              <ContactMarquee store={store} />
            </motion.div>

            {store.gallery.length > 0 && (
              <motion.div variants={fadeUp}>
                <StoreGallery gallery={store.gallery} storeName={store.name} />
              </motion.div>
            )}

            <motion.div variants={fadeUp}>
              <AboutSplit journeyIntro={store.journeyIntro} journey={store.journey} />
            </motion.div>

            {store.layanan.length > 0 && (
              <motion.div variants={fadeUp}>
                <ServicesList layanan={store.layanan} />
              </motion.div>
            )}

            {/* TEKNISI TEAM — inline full width */}
            <motion.div variants={fadeUp}>
              <TeknisiTeamPanel store={store} />
            </motion.div>

            <motion.div variants={fadeUp}>
              <ProductsGallery store={store} />
            </motion.div>

            <motion.div variants={fadeUp}>
              <TeknisiCTA store={store} />
            </motion.div>
          </motion.div>
        </>
      )}

      <div className="lg:hidden">
        <BottomNav />
        <MobileSafeAreaSpacer />
      </div>
    </div>
  )
}

/* ============================================================================
   AMBIENT ORBS
   ========================================================================== */
function AmbientOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-32 top-32 h-[28rem] w-[28rem] rounded-full bg-amber-200/25 blur-[120px]"
        animate={{ x: [0, 50, 0], y: [0, -25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-32 top-96 h-[28rem] w-[28rem] rounded-full bg-neutral-300/30 blur-[120px]"
        animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/* ============================================================================
   LOADING SHELL
   ========================================================================== */
function LoadingShell() {
  return (
    <div className="relative">
      <div className="h-[60vh] animate-pulse bg-gradient-to-br from-surface-100 to-surface-200/60" />
      <div className="mx-auto max-w-6xl space-y-6 px-4 pt-8 sm:px-6 lg:px-8">
        <div className="h-32 animate-pulse rounded-3xl bg-white shadow-soft-sm" />
        <div className="h-48 animate-pulse rounded-3xl bg-white shadow-soft-sm" />
      </div>
    </div>
  )
}

/* ============================================================================
   CINEMATIC HERO — full bleed parallax cover
   ========================================================================== */
function CinematicHero({
  store,
  liked,
  onLikeToggle,
  heroY,
  heroOpacity,
}: {
  store: PublicStoreDetailDto
  liked: boolean
  onLikeToggle: () => void
  heroY: MotionValue<number>
  heroOpacity: MotionValue<number>
}) {
  const cover =
    store.coverImage ??
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&h=900&fit=crop'

  return (
    <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden lg:h-[78vh]">
      {/* Cover with parallax */}
      <motion.div className="absolute inset-0" style={{ y: heroY, opacity: heroOpacity }}>
        <img src={cover} alt={store.name} className="absolute inset-0 h-full w-full object-cover" />
        {/* Gradient overlay — bottom dark for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/75" />
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/40 via-transparent to-amber-950/15 mix-blend-overlay" />
      </motion.div>

      {/* Top floating bar — share/like */}
      <div className="absolute inset-x-0 top-0 z-20 lg:top-24">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-4 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onLikeToggle}
              type="button"
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-colors',
                liked
                  ? 'border-rose-300 bg-rose-50/95 text-rose-600'
                  : 'border-white/30 bg-white/15 text-white hover:bg-white/25',
              )}
              aria-label="Suka"
            >
              <Heart className="h-4 w-4" weight={liked ? 'fill' : 'duotone'} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25"
              aria-label="Bagikan"
            >
              <Share2 className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Eyebrow + Title overlay (bottom-left) */}
      <div className="relative z-10 flex h-full flex-col justify-end">
        <div className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-6 lg:px-8 lg:pb-36">
          <StoreHeroBadges store={store} />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.25 }}
            className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            {store.name}
          </motion.h1>

          {(store.address || store.city) && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-medium text-white/85"
            >
              <MapPin className="h-4 w-4" weight="fill" />
              {[store.address, store.city].filter(Boolean).join(', ')}
            </motion.p>
          )}

          {/* Live stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 text-white"
          >
            <Stat
              icon={<Star className="h-4 w-4 text-amber-400" weight="fill" />}
              value={
                <span className="tabular-nums">
                  <AnimatedNumber value={store.rating} decimal />
                </span>
              }
              label={`${store.reviewCount} ulasan`}
            />
            <Divider />
            <Stat
              icon={<ShoppingBag className="h-4 w-4 text-amber-400" />}
              value={
                <span className="tabular-nums">
                  <AnimatedNumber value={store.totalPenjualan} />
                </span>
              }
              label="Terjual"
            />
            <Divider />
            <Stat
              icon={<Eye className="h-4 w-4 text-white/75" />}
              value={
                <span className="tabular-nums">
                  <AnimatedNumber value={store.profileViews} />
                </span>
              }
              label="Dilihat"
            />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 text-white/50 sm:bottom-28"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Scroll</span>
          <div className="h-7 w-px bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      </motion.div>
    </section>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xl font-black tracking-tight">{value}</span>
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/65">{label}</span>
    </div>
  )
}

function Divider() {
  return <span className="hidden h-4 w-px bg-white/30 sm:block" />
}

/* ============================================================================
   STORE HERO BADGES — Top Seller & Verified Merchant on cover
   ========================================================================== */
function StoreHeroBadges({ store }: { store: PublicStoreDetailDto }) {
  const badge = store.badge

  const heroBadge =
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur-sm'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease, delay: 0.2 }}
      className="flex flex-wrap items-center gap-2"
    >
      {badge && (
        <span
          className={cn(
            heroBadge,
            badge === 'trusted-store'
              ? 'border-yellow-200/90 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 text-amber-950 shadow-[0_4px_24px_-4px_rgba(251,191,36,0.55)]'
              : 'border-slate-200/90 bg-gradient-to-r from-slate-300 via-slate-100 to-zinc-300 text-slate-800 shadow-[0_4px_24px_-4px_rgba(148,163,184,0.5)]',
          )}
        >
          <Award
            className={cn('h-3.5 w-3.5', badge === 'trusted-store' ? 'text-amber-900' : 'text-slate-700')}
            weight="fill"
          />
          {badge === 'trusted-store' ? 'Trusted Store' : 'Top Seller'}
        </span>
      )}
      <span
        className={cn(
          heroBadge,
          'border-yellow-200/90 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 text-amber-950 shadow-[0_4px_24px_-4px_rgba(251,191,36,0.55)]',
        )}
      >
        <CheckCircle className="h-3.5 w-3.5 text-amber-900" weight="fill" />
        Verified Merchant
      </span>
    </motion.div>
  )
}

/* ============================================================================
   ANIMATED COUNTER
   ========================================================================== */
function AnimatedNumber({ value, decimal = false, suffix = '' }: { value: number; decimal?: boolean; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (latest) => {
    if (decimal) return latest.toFixed(1)
    const v = Math.round(latest)
    return v >= 1000 ? compactNumber(v) : v.toString()
  })

  useEffect(() => {
    if (!inView) return
    const controls = animate(motionValue, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [inView, value, motionValue])

  const [text, setText] = useState(decimal ? '0.0' : '0')
  useEffect(() => rounded.on('change', (v) => setText(v)), [rounded])

  return (
    <span ref={ref} className="tabular-nums">
      {text}
      {suffix}
    </span>
  )
}

/* ============================================================================
   CONTACT MARQUEE — horizontal split rows, no boxy cards
   ========================================================================== */
function ContactMarquee({ store }: { store: PublicStoreDetailDto }) {
  const items: Array<{ label: string; primary: string; secondary?: string; href?: string; icon: typeof Clock }> = []

  const hoursSummary = summarizeOperatingHours(store.operatingHours)
  if (hoursSummary.detail) {
    items.push({
      label: 'Operating Hours',
      icon: Clock,
      primary: hoursSummary.primary ?? 'Jadwal operasional',
      secondary: hoursSummary.detail,
    })
  } else if (store.jamWeekdays || store.jamWeekend) {
    items.push({
      label: 'Operating Hours',
      icon: Clock,
      primary: store.jamWeekdays ? `Sen–Jum · ${store.jamWeekdays}` : 'Berdasarkan jadwal',
      secondary: store.jamWeekend ? `Sabtu–Minggu · ${store.jamWeekend}` : undefined,
    })
  }
  if (store.phone) {
    items.push({
      label: 'Phone',
      icon: Phone,
      primary: store.phone,
      secondary: 'Tap untuk telepon langsung',
      href: `tel:${store.phone}`,
    })
  }
  if (store.email) {
    items.push({
      label: 'Email',
      icon: Mail,
      primary: store.email,
      secondary: 'Inquiry & follow up',
      href: `mailto:${store.email}`,
    })
  }

  // Social media
  if (store.instagram) {
    items.push({
      label: 'Instagram',
      icon: Instagram,
      primary: `@${store.instagram.replace(/^@/, '')}`,
      secondary: 'Follow untuk update terbaru',
      href: `https://instagram.com/${store.instagram.replace(/^@/, '')}`,
    })
  }
  if (store.tiktok) {
    items.push({
      label: 'TikTok',
      icon: Tiktok,
      primary: `@${store.tiktok.replace(/^@/, '')}`,
      secondary: 'Video tutorial & review',
      href: `https://tiktok.com/@${store.tiktok.replace(/^@/, '')}`,
    })
  }

  if (items.length === 0) return null

  return (
    <div>
      <SectionEyebrow eyebrow="Jangkauan" title="Hubungi & Kunjungi" />
      <div className="mt-5 overflow-hidden rounded-3xl border border-surface-200/70 bg-white shadow-soft-sm">
        <ul className="divide-y divide-surface-200/70">
          {items.map((item, idx) => (
            <ContactRow key={item.label} item={item} idx={idx} />
          ))}
        </ul>
      </div>
    </div>
  )
}

function ContactRow({
  item,
  idx,
}: {
  item: { label: string; primary: string; secondary?: string; href?: string; icon: typeof Clock }
  idx: number
}) {
  const Icon = item.icon
  const Wrapper: React.ElementType = item.href ? 'a' : 'div'

  return (
    <motion.li
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: idx * 0.08 }}
    >
      <Wrapper
        {...(item.href ? { href: item.href } : {})}
        className="group/row relative grid items-center gap-4 px-6 py-5 transition-colors hover:bg-gradient-to-r hover:from-amber-50/40 hover:via-amber-50/20 hover:to-transparent sm:grid-cols-[140px_auto_1fr_auto] sm:px-8"
      >
        {/* Index column with label */}
        <div className="flex items-baseline gap-3 sm:flex-col sm:items-start sm:gap-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-surface-400">
            {String(idx + 1).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
            {item.label}
          </span>
        </div>

        {/* Icon — outline only, not a colored box */}
        <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-surface-300/70 text-surface-700 transition-colors group-hover/row:border-amber-500 group-hover/row:text-amber-700 sm:inline-flex">
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="min-w-0">
          <p className="truncate text-[16px] font-bold tracking-tight text-ink">{item.primary}</p>
          {item.secondary && (
            <p className="mt-0.5 whitespace-pre-line text-[12px] leading-relaxed text-surface-500">
              {item.secondary}
            </p>
          )}
        </div>

        {/* Arrow */}
        {item.href && (
          <div className="hidden items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700 transition-transform group-hover/row:translate-x-1 sm:flex">
            <span>Open</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        )}

        {/* Left accent on hover */}
        <span className="pointer-events-none absolute inset-y-3 left-0 w-[2px] origin-bottom scale-y-0 bg-amber-600 transition-transform duration-300 group-hover/row:scale-y-100" />
      </Wrapper>
    </motion.li>
  )
}

/* ============================================================================
   ABOUT — Journey Timeline
   ========================================================================== */
const JOURNEY_ICON_MAP: Record<StoreJourneyIcon, typeof MessageCircle> = {
  message: MessageCircle,
  wrench: Wrench,
  store: Store,
  award: Award,
  clock: Clock,
  phone: Phone,
  star: Star,
}

function AboutSplit({
  journeyIntro,
  journey,
}: {
  journeyIntro: string | null
  journey: StoreJourneyMilestone[]
}) {
  if (journey.length === 0) return null

  const intro =
    journeyIntro?.trim() ||
    'Perjalanan membangun kepercayaan pelanggan satu per satu.'

  return (
    <div className="space-y-10">
      <div>
        <SectionEyebrow eyebrow="Perjalanan" title="Cerita di Balik Toko" />
        <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-surface-500">{intro}</p>

        <div className="relative mt-8">
          <div className="absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-amber-600 via-amber-400 to-surface-200 sm:left-7" />

          <div className="space-y-0">
            {journey.map((step, idx) => {
              const Icon = JOURNEY_ICON_MAP[step.icon] ?? Store
              const isLast = idx === journey.length - 1
              return (
                <motion.div
                  key={`${step.year}-${step.title}-${idx}`}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative flex gap-4 pb-8 sm:gap-5"
                >
                  <div className="relative z-10 flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 6 }}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white shadow-soft-md transition-colors sm:h-14 sm:w-14 sm:rounded-2xl',
                        isLast
                          ? 'bg-gradient-to-br from-amber-600 to-yellow-600 text-white'
                          : 'bg-white text-surface-700 group-hover:bg-amber-50 group-hover:text-amber-700',
                      )}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" weight={isLast ? 'fill' : 'duotone'} />
                    </motion.div>
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono text-[11px] font-bold tabular-nums text-amber-700">
                        {step.year}
                      </span>
                      <h4 className="text-[15px] font-black tracking-tight text-ink sm:text-[16px]">
                        {step.title}
                      </h4>
                      {isLast && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-[0.18em] text-amber-800">
                          <Sparkles className="h-2.5 w-2.5" weight="fill" />
                          Sekarang
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-surface-600">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}


/* ============================================================================
   SERVICES LIST — typographic vertical with index
   ========================================================================== */
function ServicesList({ layanan }: { layanan: string[] }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <SectionEyebrow eyebrow="Spesialisasi" title="Layanan Kami" />
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-surface-400 sm:block">
          {String(layanan.length).padStart(2, '0')} layanan
        </p>
      </div>

      <ul className="mt-6 grid gap-0 sm:grid-cols-2">
        {layanan.map((service, idx) => (
          <motion.li
            key={service}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: idx * 0.06 }}
            className="group/svc relative flex items-baseline gap-4 border-t border-surface-200/70 py-4 transition-colors hover:bg-amber-50/20"
          >
            <span className="font-mono text-[12px] font-bold tracking-[0.16em] text-surface-400 transition-colors group-hover/svc:text-amber-700">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span className="flex-1 text-[18px] font-black tracking-tight text-ink transition-transform group-hover/svc:translate-x-1">
              {service}
            </span>
            <ArrowRight className="h-4 w-4 -translate-x-2 text-surface-400 opacity-0 transition-all group-hover/svc:translate-x-0 group-hover/svc:text-amber-700 group-hover/svc:opacity-100" />
          </motion.li>
        ))}
        {/* Bottom divider */}
        <li className="border-t border-surface-200/70 sm:col-span-2" />
      </ul>
    </div>
  )
}

/* ============================================================================
   PRODUCTS PREVIEW — compact carousel-feel preview row
   ========================================================================== */
function ProductsGallery({ store }: { store: PublicStoreDetailDto }) {
  if (store.products.length === 0) {
    return (
      <div>
        <SectionEyebrow eyebrow="Etalase" title="Produk Terkurasi" />
        <div className="mt-5 rounded-2xl border border-dashed border-surface-300 bg-surface-50/50 px-5 py-8 text-center">
          <Store className="mx-auto mb-2 h-8 w-8 text-surface-400" />
          <p className="text-sm font-medium text-ink">Belum ada produk yang dipublikasikan.</p>
        </div>
      </div>
    )
  }

  // Show first 4 as a slim preview row
  const preview = store.products.slice(0, 4)

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <SectionEyebrow eyebrow="Etalase" title="Produk Terkurasi" />
        <Link
          href={`/toko/${store.id}/produk`}
          className="group inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700 hover:text-amber-800"
        >
          Lihat semua
          <span className="font-mono text-[10px] tabular-nums text-surface-400">
            ({store.products.length}+)
          </span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {preview.map((p, idx) => (
          <ProductCard key={p.id} product={p} idx={idx} />
        ))}
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
        transition={{ delay: idx * 0.05 }}
        whileHover={{ y: -4 }}
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
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.5 }}
          />
          <div className="absolute inset-x-2 bottom-2 inline-flex items-center justify-center rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-ink backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
            Lihat
            <ArrowRight className="ml-1 h-3 w-3" />
          </div>
        </div>
        <div className="p-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-700">
            {categoryLabel(product.category)}
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] font-bold leading-snug text-ink">{product.name}</p>
          <p className="mt-2 text-[14px] font-black tabular-nums text-amber-700">{formatPrice(product.price)}</p>
        </div>
      </motion.div>
    </Link>
  )
}

/* ============================================================================
   TEKNISI CTA — premium banner with mesh gradient
   ========================================================================== */
function TeknisiCTA({ store }: { store: PublicStoreDetailDto }) {
  return (
    <Link href={`/teknisi/${store.teknisiId}`} className="group block">
      <motion.div
        whileHover={{ y: -4 }}
        className="relative overflow-hidden rounded-3xl border border-neutral-800/80 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 22%, rgba(251,191,36,0.16), transparent 52%), radial-gradient(circle at 82% 78%, rgba(255,255,255,0.07), transparent 55%), linear-gradient(135deg, #0a0a0a 0%, #171717 38%, #262626 72%, #404040 100%)',
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative grid gap-5 p-8 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8 sm:p-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-200 backdrop-blur-md">
              <Wrench className="h-3 w-3" weight="fill" />
              Toko ini dikelola teknisi
            </span>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Konsultasi langsung dengan teknisi pemilik toko
            </h3>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-neutral-300">
              Lihat profil, jam respons, dan booking sesi konsultasi sebelum atau setelah pembelian.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/50 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 px-4 py-2.5 text-[12px] font-bold text-amber-950 shadow-[0_4px_20px_-6px_rgba(251,191,36,0.55)] transition-transform group-hover:scale-[1.02]">
              <User className="h-4 w-4" />
              Lihat profil teknisi
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

/* ============================================================================
   SECTION EYEBROW — reusable header
   ========================================================================== */
function SectionEyebrow({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">{title}</h2>
    </div>
  )
}

/* ============================================================================
   TEKNISI TEAM PANEL — premium sticky sidebar (right column)
   ========================================================================== */
function TeknisiTeamPanel({ store }: { store: PublicStoreDetailDto }) {
  const team = store.team

  if (team.length === 0) return null

  return (
    <div className="relative overflow-hidden rounded-3xl border border-surface-200/70 bg-white shadow-soft-sm">
      {/* Luxe silver header */}
      <div className="relative overflow-hidden p-5">
        {/* Layered silver mesh — deep charcoal → silver highlight */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 25%, rgba(255,255,255,0.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08), transparent 55%), linear-gradient(135deg,#0a0a0a 0%,#262626 28%,#525252 58%,#a3a3a3 88%,#d4d4d4 100%)',
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Brushed metal lines */}
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 1px, transparent 1px, transparent 3px)',
          }}
        />

        {/* Light sweep — slow, premium */}
        <motion.div
          className="pointer-events-none absolute inset-y-0 -inset-x-1/2 opacity-50"
          style={{
            background:
              'linear-gradient(110deg, transparent 38%, rgba(255,255,255,0.28) 50%, transparent 62%)',
          }}
          animate={{ x: ['-15%', '115%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        />

        {/* Hairline top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Decorative star accent */}
        <motion.div
          className="absolute right-4 top-4 text-white/30"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="h-5 w-5" weight="fill" />
        </motion.div>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md">
            <Wrench className="h-3 w-3" weight="fill" />
            Tim Teknisi
          </span>
          <h3 className="mt-3 text-lg font-black tracking-tight text-white drop-shadow-sm">
            Profesional di Toko Ini
          </h3>
          <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-200/90">
            Konsultasi langsung dengan teknisi yang menangani toko & memberikan garansi layanan.
          </p>
        </div>

        {/* Hairline bottom highlight */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Member list */}
      <ul className="divide-y divide-surface-200/70">
        {team.map((member, idx) => (
          <TeamMemberRow key={member.id} member={member} idx={idx} />
        ))}
      </ul>

      {/* Footer note */}
      <div className="border-t border-surface-200/70 bg-surface-50/50 px-5 py-3">
        <p className="inline-flex items-center gap-1.5 text-[10.5px] text-surface-500">
          <Sparkles className="h-3 w-3 text-amber-600" weight="fill" />
          Verified by IndoTeknizi
        </p>
      </div>
    </div>
  )
}

function TeamMemberRow({
  member,
  idx,
}: {
  member: PublicStoreDetailDto['team'][number]
  idx: number
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: idx * 0.08 }}
    >
      <Link
        href={`/teknisi/${member.id}`}
        className="group/m relative flex items-start gap-3 px-5 py-4 transition-colors hover:bg-gradient-to-r hover:from-amber-50/40 hover:via-amber-50/20 hover:to-transparent"
      >
        {/* Avatar with rotating ring */}
        <div className="relative flex-shrink-0">
          {/* Rotating conic ring */}
          <motion.div
            className="absolute -inset-1 rounded-2xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{
              background:
                'conic-gradient(from 0deg, rgba(251,191,36,0.55), rgba(217,119,6,0.55), rgba(251,191,36,0.55))',
              filter: 'blur(6px)',
            }}
          />
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-gradient-to-br from-amber-500 to-yellow-600 text-base font-black text-white shadow-soft-md">
            {member.image ? (
              <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              member.name.charAt(0)
            )}
          </div>
          {member.isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-500" />
            </span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-[14px] font-bold tracking-tight text-ink">{member.name}</p>
            {member.isVerified && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/90 px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-[0.16em] text-amber-800 shadow-[0_1px_4px_-1px_rgba(217,119,6,0.25)]">
                <CheckCircle className="h-2.5 w-2.5 text-amber-600" weight="fill" />
                Verified
              </span>
            )}
          </div>

          {/* Role + experience */}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-surface-500">
            <span className="font-bold uppercase tracking-[0.16em] text-amber-700">
              {member.role === 'owner' ? 'Owner & Lead Teknisi' : 'Staff Teknisi'}
            </span>
            {member.experience && (
              <>
                <span className="text-surface-300">·</span>
                <span>{member.experience}</span>
              </>
            )}
          </div>

          {/* Specialty inline */}
          {member.specialty.length > 0 && (
            <p className="mt-1.5 line-clamp-1 text-[11px] text-surface-600">
              {member.specialty.slice(0, 3).join(' · ')}
            </p>
          )}

          {/* Stats inline mini bar */}
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1 font-bold text-ink">
              <Star className="h-3 w-3 text-amber-500" weight="fill" />
              {member.rating.toFixed(1)}
              <span className="font-medium text-surface-500">({member.reviewCount})</span>
            </span>
            <span className="text-surface-300">·</span>
            <span className="text-surface-600">
              <span className="font-bold tabular-nums text-ink">{compactNumber(member.totalKonsultasi)}</span>{' '}
              konsultasi
            </span>
          </div>
        </div>

        {/* Arrow indicator */}
        <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-surface-400 transition-all group-hover/m:translate-x-1 group-hover/m:text-amber-700" />

        {/* Left accent on hover */}
        <span className="pointer-events-none absolute inset-y-3 left-0 w-[2px] origin-bottom scale-y-0 bg-amber-600 transition-transform duration-300 group-hover/m:scale-y-100" />
      </Link>
    </motion.li>
  )
}

/* ============================================================================
   STORE GALLERY — dynamic mosaic + lightbox
   ========================================================================== */
function StoreGallery({ gallery, storeName }: { gallery: string[]; storeName: string }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'workshop' | 'team' | 'service'>('all')

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activeIdx === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveIdx(null)
      if (e.key === 'ArrowRight') setActiveIdx((i) => (i === null ? 0 : (i + 1) % gallery.length))
      if (e.key === 'ArrowLeft')
        setActiveIdx((i) => (i === null ? 0 : (i - 1 + gallery.length) % gallery.length))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIdx, gallery.length])

  // Lock body scroll on lightbox
  useEffect(() => {
    if (activeIdx !== null) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [activeIdx])

  return (
    <section>
      {/* Header — editorial */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">Galeri</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
            Suasana &amp; Workshop
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-surface-500">
            Lihat langsung suasana toko, peralatan kerja, dan tim teknisi yang melayani Anda.
          </p>
        </div>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-surface-400 sm:inline">
          {gallery.length} foto
        </span>
      </div>

      {/* Mosaic — asymmetric grid */}
      <div className="mt-6">
        <DynamicMosaic gallery={gallery} onPick={setActiveIdx} />
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {activeIdx !== null && (
          <Lightbox
            gallery={gallery}
            activeIdx={activeIdx}
            onClose={() => setActiveIdx(null)}
            onPrev={() => setActiveIdx((i) => (i === null ? 0 : (i - 1 + gallery.length) % gallery.length))}
            onNext={() => setActiveIdx((i) => (i === null ? 0 : (i + 1) % gallery.length))}
            storeName={storeName}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

/* ============================================================================
   DYNAMIC MOSAIC — asymmetric layout, not a uniform grid
   ========================================================================== */
function DynamicMosaic({
  gallery,
  onPick,
}: {
  gallery: string[]
  onPick: (idx: number) => void
}) {
  // Pattern up to 8 photos: hero + 2 vertical + 2 wide + 3 small
  const slots = [
    { className: 'col-span-2 row-span-2 sm:col-span-3 sm:row-span-2', aspect: 'aspect-[4/3]' }, // big hero
    { className: 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-2', aspect: 'aspect-[3/4]' }, // tall
    { className: 'col-span-2 row-span-1 sm:col-span-2 sm:row-span-1', aspect: 'aspect-[3/2]' }, // wide
    { className: 'col-span-1 row-span-1 sm:col-span-2 sm:row-span-1', aspect: 'aspect-[3/2]' }, // wide
    { className: 'col-span-1 row-span-1 sm:col-span-1 sm:row-span-1', aspect: 'aspect-square' }, // small
    { className: 'col-span-1 row-span-1 sm:col-span-1 sm:row-span-1', aspect: 'aspect-square' }, // small
    { className: 'col-span-2 row-span-1 sm:col-span-2 sm:row-span-1', aspect: 'aspect-[2/1]' }, // wide
    { className: 'col-span-2 row-span-1 sm:col-span-3 sm:row-span-1', aspect: 'aspect-[3/1]' }, // panoramic
  ]

  return (
    <div className="grid auto-rows-[120px] grid-cols-4 gap-2 sm:auto-rows-[140px] sm:grid-cols-5 sm:gap-3">
      {gallery.slice(0, 8).map((src, idx) => {
        const slot = slots[idx] ?? slots[slots.length - 1]
        return (
          <MosaicTile
            key={`${src}-${idx}`}
            src={src}
            idx={idx}
            className={slot.className}
            onClick={() => onPick(idx)}
          />
        )
      })}
    </div>
  )
}

function MosaicTile({
  src,
  idx,
  className,
  onClick,
}: {
  src: string
  idx: number
  className: string
  onClick: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        x.set((e.clientX - rect.left) / rect.width)
        y.set((e.clientY - rect.top) / rect.height)
      }}
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(idx * 0.06, 0.3), duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group/tile relative overflow-hidden rounded-2xl bg-surface-100 shadow-soft-xs transition-shadow hover:shadow-soft-md',
        className,
      )}
    >
      <motion.img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Cursor-following spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/tile:opacity-100"
        style={{
          background: useTransform(
            [x, y],
            ([gx, gy]) =>
              `radial-gradient(circle at ${(gx as number) * 100}% ${(gy as number) * 100}%, rgba(255,255,255,0.25), transparent 50%)`,
          ),
        }}
      />

      {/* Bottom gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-transparent opacity-0 transition-opacity group-hover/tile:from-black/50 group-hover/tile:opacity-100" />

      {/* Index badge */}
      <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[8px] font-black tabular-nums text-ink opacity-0 backdrop-blur-sm transition-opacity group-hover/tile:opacity-100">
        {idx + 1}
      </span>

      {/* Hover hint */}
      <span className="absolute inset-x-3 bottom-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white opacity-0 transition-opacity group-hover/tile:opacity-100">
        <Eye className="h-3 w-3" weight="fill" />
        Lihat
      </span>
    </motion.button>
  )
}

/* ============================================================================
   LIGHTBOX — fullscreen viewer with thumbnails strip
   ========================================================================== */
function Lightbox({
  gallery,
  activeIdx,
  onClose,
  onPrev,
  onNext,
  storeName,
}: {
  gallery: string[]
  activeIdx: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  storeName: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200] flex flex-col bg-[#0a0a0f]/95 backdrop-blur-xl"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Galeri</p>
          <p className="text-[13px] font-black text-white">{storeName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] tabular-nums text-white/70">
            {String(activeIdx + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label="Tutup"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/15"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div
        className="relative flex-1 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prev button */}
        <button
          type="button"
          onClick={onPrev}
          aria-label="Sebelumnya"
          className="absolute left-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition-all hover:bg-white/15 hover:scale-110"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIdx}
            src={gallery[activeIdx]}
            alt=""
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 m-auto max-h-[calc(100vh-180px)] max-w-full object-contain"
            onClick={onClose}
          />
        </AnimatePresence>

        {/* Next button */}
        <button
          type="button"
          onClick={onNext}
          aria-label="Selanjutnya"
          className="absolute right-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition-all hover:bg-white/15 hover:scale-110"
        >
          <ChevronLeft className="h-5 w-5 rotate-180" />
        </button>
      </div>

      {/* Thumbnails strip */}
      <div
        className="relative z-10 border-t border-white/10 px-3 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto scrollbar-hide">
          {gallery.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                // Update active idx via parent — done by re-trigger of arrow nav approximation.
                // Keep simple: force prev/next chain to land here:
                const diff = idx - activeIdx
                if (diff > 0) for (let i = 0; i < diff; i++) onNext()
                else if (diff < 0) for (let i = 0; i < -diff; i++) onPrev()
              }}
              className={cn(
                'relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                idx === activeIdx
                  ? 'border-amber-400 opacity-100 ring-1 ring-amber-400/50'
                  : 'border-white/10 opacity-50 hover:opacity-100',
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
