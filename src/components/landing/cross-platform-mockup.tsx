'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

/* ---------------------------------------------------------------------------
   DATA
   ------------------------------------------------------------------------- */

type TabId = 'dashboard' | 'pesanan' | 'saldo'
type CategoryId = 'Semua' | 'Android' | 'iPhone' | 'Aksesoris'

const tabletTabs: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pesanan', label: 'Pesanan' },
  { id: 'saldo', label: 'Saldo' },
]

const phoneCategories: CategoryId[] = ['Semua', 'Android', 'iPhone', 'Aksesoris']

const phoneProducts = [
  { name: 'iPhone 14 Pro', price: 'Rp 14.5JT', tone: 'primary' as const, hint: 'iPhone' as const },
  { name: 'Galaxy S24 Ultra', price: 'Rp 19.9JT', tone: 'cyan' as const, hint: 'Android' as const },
  { name: 'Earbuds Pro 2', price: 'Rp 1.2JT', tone: 'amber' as const, hint: 'Aksesoris' as const },
  { name: 'Charger 30W USB-C', price: 'Rp 220K', tone: 'rose' as const, hint: 'Aksesoris' as const },
]

const TONE_BG: Record<'primary' | 'emerald' | 'amber' | 'cyan' | 'rose', string> = {
  primary: 'from-primary-200 to-primary-100',
  emerald: 'from-emerald-200 to-emerald-100',
  amber: 'from-amber-200 to-amber-100',
  cyan: 'from-cyan-200 to-cyan-100',
  rose: 'from-rose-200 to-rose-100',
}

const STATUS_LABEL = { progress: 'Proses', done: 'Selesai', queue: 'Antri' } as const
const STATUS_TONE = {
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
} as const

type Order = {
  id: string
  title: string
  status: keyof typeof STATUS_LABEL
  tone: keyof typeof STATUS_TONE
}

const ORDER_POOL: Order[] = [
  { id: '#IT-0241', title: 'Service iPhone 14 Pro', status: 'progress', tone: 'amber' },
  { id: '#IT-0240', title: 'Ganti baterai Redmi Note 12', status: 'done', tone: 'emerald' },
  { id: '#IT-0239', title: 'Service LCD Samsung A54', status: 'queue', tone: 'cyan' },
  { id: '#IT-0242', title: 'Flashing Oppo Reno 11', status: 'progress', tone: 'amber' },
  { id: '#IT-0243', title: 'Konsultasi Unlock iPhone 13', status: 'done', tone: 'emerald' },
  { id: '#IT-0244', title: 'Servis charging Vivo V29', status: 'queue', tone: 'cyan' },
]

/* ---------------------------------------------------------------------------
   ANIMATED CURSOR
   ------------------------------------------------------------------------- */

type CursorTarget = { x: number; y: number; click?: boolean }

/** SVG cursor that floats between targets and emits a click ripple. */
function AnimatedCursor({
  target,
  device,
}: {
  target: CursorTarget
  device: 'tablet' | 'phone'
}) {
  return (
    <motion.div
      className="pointer-events-none absolute z-30"
      initial={false}
      animate={{ left: `${target.x}%`, top: `${target.y}%` }}
      transition={{ type: 'spring', stiffness: 80, damping: 18, mass: 0.8 }}
      style={{ transform: 'translate(-2px, -2px)' }}
    >
      <div className="relative">
        {/* Click ripple */}
        <AnimatePresence>
          {target.click && (
            <motion.span
              key={`${target.x}-${target.y}`}
              className={cn(
                'absolute -left-2 -top-2 rounded-full ring-2',
                device === 'tablet'
                  ? 'h-6 w-6 ring-primary-500/70'
                  : 'h-4 w-4 ring-primary-500/70',
              )}
              initial={{ scale: 0.4, opacity: 0.85 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* Cursor arrow */}
        <svg
          width={device === 'tablet' ? 18 : 12}
          height={device === 'tablet' ? 18 : 12}
          viewBox="0 0 24 24"
          className="drop-shadow-[0_2px_6px_rgba(15,23,42,0.35)]"
          aria-hidden
        >
          <path
            d="M3 2 L21 12 L13 13 L11 21 Z"
            fill="#0f172a"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.div>
  )
}

/* ---------------------------------------------------------------------------
   ANIMATED COUNTER (lightweight, no observer — driven by parent state)
   ------------------------------------------------------------------------- */

function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const from = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setValue(from + (target - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function formatRupiahShort(v: number) {
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)}K`
  return `Rp ${Math.round(v)}`
}

/* ---------------------------------------------------------------------------
   MAIN COMPONENT
   ------------------------------------------------------------------------- */

type CrossPlatformMockupProps = {
  className?: string
}

export function CrossPlatformMockup({ className }: CrossPlatformMockupProps) {
  const reduced = useReducedMotion()

  // Tablet state — driven by virtual cursor demo
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [tabletCursor, setTabletCursor] = useState<CursorTarget>({ x: 50, y: 12, click: false })

  // Phone state
  const [activeCategory, setActiveCategory] = useState<CategoryId>('Semua')
  const [phoneCursor, setPhoneCursor] = useState<CursorTarget>({ x: 50, y: 18, click: false })
  const [cartCount, setCartCount] = useState(2)

  // Tablet demo loop — clicks tabs in sequence, then resets.
  useEffect(() => {
    if (reduced) return
    const sequence: { tab: TabId; cursor: CursorTarget; delay: number }[] = [
      { tab: 'dashboard', cursor: { x: 42, y: 11, click: true }, delay: 1800 },
      { tab: 'pesanan', cursor: { x: 52, y: 11, click: true }, delay: 4200 },
      { tab: 'saldo', cursor: { x: 60, y: 11, click: true }, delay: 4200 },
      { tab: 'dashboard', cursor: { x: 42, y: 11, click: true }, delay: 4200 },
    ]
    let i = 0
    let timer: ReturnType<typeof setTimeout>

    const run = () => {
      const step = sequence[i % sequence.length]
      // Move cursor first
      setTabletCursor({ x: step.cursor.x, y: step.cursor.y, click: false })
      // Click after travel
      const clickT = setTimeout(() => {
        setTabletCursor({ x: step.cursor.x, y: step.cursor.y, click: true })
        setActiveTab(step.tab)
      }, 700)
      timer = setTimeout(() => {
        clearTimeout(clickT)
        i += 1
        run()
      }, step.delay)
    }

    run()
    return () => clearTimeout(timer)
  }, [reduced])

  // Phone demo loop — taps categories, then taps a product (cart++).
  useEffect(() => {
    if (reduced) return
    const sequence: { cat: CategoryId; cursor: CursorTarget; delay: number; addCart?: boolean }[] = [
      { cat: 'Semua', cursor: { x: 18, y: 35, click: true }, delay: 2200 },
      { cat: 'Android', cursor: { x: 38, y: 35, click: true }, delay: 2400 },
      { cat: 'iPhone', cursor: { x: 58, y: 35, click: true }, delay: 2400 },
      { cat: 'Aksesoris', cursor: { x: 80, y: 35, click: true }, delay: 2400 },
      { cat: 'Aksesoris', cursor: { x: 70, y: 78, click: true }, delay: 2600, addCart: true },
    ]
    let i = 0
    let timer: ReturnType<typeof setTimeout>

    const run = () => {
      const step = sequence[i % sequence.length]
      setPhoneCursor({ x: step.cursor.x, y: step.cursor.y, click: false })
      const clickT = setTimeout(() => {
        setPhoneCursor({ x: step.cursor.x, y: step.cursor.y, click: true })
        setActiveCategory(step.cat)
        if (step.addCart) setCartCount((c) => c + 1)
      }, 700)
      timer = setTimeout(() => {
        clearTimeout(clickT)
        i += 1
        run()
      }, step.delay)
    }

    run()
    return () => clearTimeout(timer)
  }, [reduced])

  return (
    <div className={cn('relative', className)}>
      {/* Tablet shell — gentle float */}
      <motion.div
        className="overflow-hidden rounded-[1.6rem] border border-surface-200/70 bg-gradient-to-br from-surface-900 to-surface-950 p-2 shadow-soft-xl"
        animate={reduced ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <TabletScreen activeTab={activeTab} cursor={tabletCursor} reduced={!!reduced} />
      </motion.div>

      {/* Phone shell — counter-float so it feels alive but not jittery */}
      <motion.div
        className="absolute -bottom-12 -right-2 z-20 w-36 sm:w-40"
        animate={reduced ? {} : { y: [0, 6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <div className="relative rounded-[1.7rem] border border-surface-200/70 bg-gradient-to-br from-surface-900 to-surface-950 p-1.5 shadow-soft-xl">
          <span className="absolute right-[-2px] top-[26%] h-8 w-[2px] rounded-l-full bg-surface-700" />
          <span className="absolute left-[-2px] top-[18%] h-5 w-[2px] rounded-r-full bg-surface-700" />
          <span className="absolute left-[-2px] top-[30%] h-9 w-[2px] rounded-r-full bg-surface-700" />
          <PhoneScreen
            activeCategory={activeCategory}
            cursor={phoneCursor}
            cartCount={cartCount}
            reduced={!!reduced}
          />
        </div>
      </motion.div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   TABLET SCREEN
   ------------------------------------------------------------------------- */

function TabletScreen({
  activeTab,
  cursor,
  reduced,
}: {
  activeTab: TabId
  cursor: CursorTarget
  reduced: boolean
}) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[1.2rem] bg-gradient-to-br from-white via-surface-50/50 to-primary-50/40 p-3.5">
      {/* Top bar */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-300" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-primary-300" />
        </div>
        <div className="flex items-center gap-1.5 text-[8px] font-semibold text-surface-500">
          {tabletTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className="relative px-1.5 py-0.5"
              aria-pressed={activeTab === t.id}
            >
              {activeTab === t.id && (
                <motion.span
                  layoutId="tablet-tab-pill"
                  className="absolute inset-0 rounded-md bg-white text-primary-700 shadow-soft-xs"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                />
              )}
              <span className={cn('relative', activeTab === t.id ? 'text-primary-700' : '')}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
        <div className="flex h-3.5 items-center gap-1 rounded-full bg-primary-50 px-1.5 text-[8px] font-bold text-primary-700">
          <span className="relative flex h-1 w-1">
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-70"
              animate={reduced ? {} : { scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
            <span className="relative inline-flex h-1 w-1 rounded-full bg-primary-500" />
          </span>
          Live
        </div>
      </div>

      {/* Body — switches per tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <DashboardView reduced={reduced} />
          </motion.div>
        )}
        {activeTab === 'pesanan' && (
          <motion.div
            key="pesanan"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <PesananView />
          </motion.div>
        )}
        {activeTab === 'saldo' && (
          <motion.div
            key="saldo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <SaldoView reduced={reduced} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Virtual cursor */}
      {!reduced && <AnimatedCursor target={cursor} device="tablet" />}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   TABLET — DASHBOARD VIEW (KPI counters, animated bar chart, progress, orders)
   ------------------------------------------------------------------------- */

function DashboardView({ reduced }: { reduced: boolean }) {
  const pesanan = useCounter(24, 1400)
  const earning = useCounter(4_200_000, 1600)
  const rating = useCounter(4.9, 1400)
  const progress = useCounter(68, 1400)

  // Bars cycle to add motion
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setTick((t) => t + 1), 2400)
    return () => clearInterval(id)
  }, [reduced])

  const bars = useMemo(() => {
    const base = [42, 64, 52, 78, 88, 96, 72]
    return base.map((b, i) => {
      // small jitter per cycle for "live" feel
      const j = ((tick + i) % 4) * 4 - 6
      return Math.max(20, Math.min(100, b + j))
    })
  }, [tick])

  return (
    <div className="grid grid-cols-[0.85fr_2fr] gap-2.5">
      {/* Left rail (skeleton-style) */}
      <div className="space-y-1.5">
        <div className="rounded-md bg-gradient-to-br from-primary-100/70 to-emerald-100/40 p-1.5">
          <div className="h-1.5 w-3/4 rounded bg-primary-300/80" />
          <div className="mt-1 h-1 w-1/2 rounded bg-primary-200/80" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-md bg-white/70 px-1.5 py-1 ring-1 ring-inset ring-surface-200/50"
          >
            <span className="h-1.5 w-1.5 rounded-sm bg-surface-300" />
            <div className="h-1 w-3/5 rounded bg-surface-200" />
          </div>
        ))}
      </div>

      {/* Right column */}
      <div className="space-y-2">
        {/* KPI cards — counter values */}
        <div className="grid grid-cols-3 gap-1.5">
          <KpiCard label="Pesanan Aktif" accent="primary" value={Math.round(pesanan).toString()} />
          <KpiCard label="Earning" accent="emerald" value={formatRupiahShort(earning)} />
          <KpiCard label="Rating" accent="amber" value={rating.toFixed(1)} />
        </div>

        {/* Chart + ticket */}
        <div className="grid grid-cols-[1.4fr_1fr] gap-1.5">
          <div className="rounded-lg border border-surface-200/70 bg-white p-2 shadow-soft-xs">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[8px] font-bold text-ink">Konsultasi 7 hari</p>
              <span className="rounded-full bg-emerald-50 px-1 py-px text-[7px] font-bold text-emerald-700">
                ↑ 12%
              </span>
            </div>
            <div className="flex h-12 items-end gap-0.5">
              {bars.map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-primary-600 via-primary-400 to-primary-200"
                  initial={{ height: '20%' }}
                  animate={{ height: `${h}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.04 }}
                  style={{ minHeight: 2 }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-primary-200/70 bg-gradient-to-br from-primary-50 to-white p-2 shadow-soft-xs">
            <p className="text-[7px] font-bold uppercase tracking-[0.16em] text-primary-700">
              Tiket Aktif
            </p>
            <p className="mt-0.5 truncate text-[9px] font-bold text-ink">Service iPhone 14 Pro</p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="mt-1 text-[7px] font-semibold text-primary-700 tabular-nums">
              {Math.round(progress)}% selesai · 8 mnt
            </p>
          </div>
        </div>

        {/* Orders */}
        <div className="space-y-1">
          {ORDER_POOL.slice(0, 3).map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-1.5 rounded-md border border-surface-200/60 bg-white px-1.5 py-1 shadow-soft-xs"
            >
              <span className="font-mono text-[7px] font-bold text-surface-400">{order.id}</span>
              <p className="min-w-0 flex-1 truncate text-[8.5px] font-semibold text-ink">
                {order.title}
              </p>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[7px] font-bold ring-1 ring-inset',
                  STATUS_TONE[order.tone],
                )}
              >
                {STATUS_LABEL[order.status]}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'primary' | 'emerald' | 'amber'
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-lg border border-surface-200/70 bg-white p-1.5 shadow-soft-xs"
    >
      <div
        className={cn(
          'mb-1 h-0.5 w-5 rounded-full bg-gradient-to-r',
          accent === 'primary'
            ? 'from-primary-500 to-emerald-400'
            : accent === 'emerald'
              ? 'from-emerald-500 to-cyan-400'
              : 'from-amber-400 to-amber-300',
        )}
      />
      <p className="text-[8px] font-semibold text-surface-500">{label}</p>
      <p className="mt-0.5 text-[12px] font-black tracking-tight text-ink tabular-nums">{value}</p>
    </motion.div>
  )
}

/* ---------------------------------------------------------------------------
   TABLET — PESANAN VIEW (queue list w/ stagger)
   ------------------------------------------------------------------------- */

function PesananView() {
  return (
    <div className="grid grid-cols-[0.85fr_2fr] gap-2.5">
      {/* Filter rail */}
      <div className="space-y-1.5">
        <div className="rounded-md bg-gradient-to-br from-primary-100/70 to-emerald-100/40 p-1.5">
          <p className="text-[7px] font-bold uppercase tracking-[0.14em] text-primary-700">Filter</p>
          <div className="mt-1 flex flex-wrap gap-0.5">
            {['Semua', 'Antri', 'Proses', 'Selesai'].map((f, i) => (
              <span
                key={f}
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[6.5px] font-bold',
                  i === 0
                    ? 'bg-ink text-white'
                    : 'border border-surface-200 bg-white text-surface-600',
                )}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-md bg-white/70 p-1.5 ring-1 ring-inset ring-surface-200/50"
          >
            <div className="h-1 w-3/5 rounded bg-surface-200" />
            <div className="mt-1 h-1 w-2/5 rounded bg-surface-200/70" />
          </div>
        ))}
      </div>

      {/* Order list */}
      <div className="space-y-1">
        {ORDER_POOL.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex items-center gap-1.5 rounded-md border border-surface-200/60 bg-white px-1.5 py-1.5 shadow-soft-xs"
          >
            <span className="font-mono text-[7px] font-bold text-surface-400">{order.id}</span>
            <p className="min-w-0 flex-1 truncate text-[8.5px] font-semibold text-ink">
              {order.title}
            </p>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[7px] font-bold ring-1 ring-inset',
                STATUS_TONE[order.tone],
              )}
            >
              {STATUS_LABEL[order.status]}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   TABLET — SALDO VIEW (animated wallet card + sparkline)
   ------------------------------------------------------------------------- */

function SaldoView({ reduced }: { reduced: boolean }) {
  const balance = useCounter(8_450_000, 1500)
  const today = useCounter(420_000, 1500)
  const points = useMemo(
    () => [10, 24, 18, 32, 28, 44, 38, 56, 50, 66, 60, 78],
    [],
  )

  return (
    <div className="grid grid-cols-[0.85fr_2fr] gap-2.5">
      <div className="space-y-1.5">
        <div className="rounded-md bg-gradient-to-br from-primary-100/70 to-emerald-100/40 p-1.5">
          <p className="text-[7px] font-bold uppercase tracking-[0.14em] text-primary-700">
            Wallet
          </p>
          <p className="mt-0.5 text-[8px] font-semibold text-ink">Aktif</p>
        </div>
        {['Topup', 'Withdraw', 'Riwayat'].map((s) => (
          <div
            key={s}
            className="flex items-center gap-1.5 rounded-md bg-white/70 px-1.5 py-1 ring-1 ring-inset ring-surface-200/50"
          >
            <span className="h-1.5 w-1.5 rounded-sm bg-primary-300" />
            <span className="text-[7.5px] font-semibold text-surface-600">{s}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-lg border border-primary-200/60 bg-gradient-to-br from-primary-600 via-primary-700 to-emerald-700 p-2.5 text-white shadow-soft-xs"
        >
          <p className="text-[7px] font-bold uppercase tracking-[0.16em] text-white/70">Saldo</p>
          <p className="mt-0.5 text-[14px] font-black tracking-tight tabular-nums">
            {formatRupiahShort(balance)}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[7.5px] font-semibold text-white/80">
            <span>Hari ini</span>
            <span className="rounded-full bg-white/15 px-1 py-px tabular-nums">
              + {formatRupiahShort(today)}
            </span>
          </div>

          {/* Decorative orbs */}
          <motion.span
            className="absolute -right-2 -top-2 h-10 w-10 rounded-full bg-white/15"
            animate={reduced ? {} : { scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Sparkline */}
        <div className="rounded-lg border border-surface-200/70 bg-white p-2 shadow-soft-xs">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[8px] font-bold text-ink">Pemasukan</p>
            <span className="rounded-full bg-emerald-50 px-1 py-px text-[7px] font-bold text-emerald-700">
              ↑ 18%
            </span>
          </div>
          <Sparkline points={points} reduced={reduced} />
        </div>

        {/* Mini list */}
        <div className="space-y-1">
          {[
            { id: '#TX-991', title: 'Penerimaan order #IT-0240', value: '+ Rp 320K' },
            { id: '#TX-990', title: 'Withdraw ke BCA', value: '- Rp 1.5JT' },
          ].map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
              className="flex items-center gap-1.5 rounded-md border border-surface-200/60 bg-white px-1.5 py-1 shadow-soft-xs"
            >
              <span className="font-mono text-[7px] font-bold text-surface-400">{tx.id}</span>
              <p className="min-w-0 flex-1 truncate text-[8.5px] font-semibold text-ink">
                {tx.title}
              </p>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[7px] font-bold tabular-nums',
                  tx.value.startsWith('+')
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700',
                )}
              >
                {tx.value}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Sparkline({ points, reduced }: { points: number[]; reduced: boolean }) {
  const max = Math.max(...points)
  const w = 200
  const h = 48
  const step = w / (points.length - 1)
  const path = points
    .map((p, i) => {
      const x = i * step
      const y = h - (p / max) * (h - 6) - 3
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  const area = `${path} L ${w} ${h} L 0 ${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" aria-hidden>
      <defs>
        <linearGradient id="spark-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill="url(#spark-area)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  )
}

/* ---------------------------------------------------------------------------
   PHONE SCREEN
   ------------------------------------------------------------------------- */

function PhoneScreen({
  activeCategory,
  cursor,
  cartCount,
  reduced,
}: {
  activeCategory: CategoryId
  cursor: CursorTarget
  cartCount: number
  reduced: boolean
}) {
  const visible = useMemo(() => {
    if (activeCategory === 'Semua') return phoneProducts
    return phoneProducts.filter((p) => p.hint === activeCategory)
  }, [activeCategory])

  return (
    <div className="relative aspect-[9/19] overflow-hidden rounded-[1.45rem] bg-gradient-to-br from-white via-surface-50/40 to-emerald-50/40">
      {/* Notch */}
      <div className="relative z-10 flex justify-center">
        <span className="mt-1.5 h-1 w-10 rounded-full bg-surface-200" />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-2.5 pb-1 pt-1.5 text-[7px] font-bold text-surface-500">
        <span>9:41</span>
        <div className="flex gap-1">
          <span className="h-1 w-2 rounded-sm bg-surface-300" />
          <span className="h-1 w-1 rounded-full bg-surface-300" />
          <span className="h-1 w-2.5 rounded-sm bg-surface-400" />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-2.5">
        <div className="flex items-center gap-1">
          <div className="flex h-3 w-3 items-center justify-center rounded-md bg-gradient-to-br from-primary-500 to-emerald-600 text-[7px] font-black text-white shadow-soft-xs">
            i
          </div>
          <span className="text-[8px] font-black tracking-tight text-ink">Shop</span>
        </div>
        <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center rounded-md bg-white shadow-soft-xs">
          <span className="text-[7px]">🛒</span>
          <motion.span
            key={cartCount}
            initial={reduced ? { scale: 1 } : { scale: 1.6 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            className="absolute -right-0.5 -top-0.5 flex h-1.5 w-1.5 items-center justify-center rounded-full bg-rose-500 text-[5px] font-bold text-white"
          >
            {cartCount}
          </motion.span>
        </span>
      </div>

      {/* Search */}
      <div className="mx-2.5 mt-1.5 flex items-center gap-1 rounded-full border border-surface-200/70 bg-white px-1.5 py-1 shadow-soft-xs">
        <span className="text-[7px] text-surface-400">🔍</span>
        <span className="text-[7px] text-surface-400">Cari handphone…</span>
      </div>

      {/* Promo */}
      <motion.div
        animate={
          reduced
            ? {}
            : {
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }
        }
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage:
            'linear-gradient(120deg, #10b981 0%, #059669 50%, #047857 100%)',
          backgroundSize: '200% 200%',
        }}
        className="relative mx-2.5 mt-1.5 h-9 overflow-hidden rounded-lg p-1.5 text-white shadow-md"
      >
        <p className="text-[6px] font-bold uppercase tracking-[0.14em] opacity-80">Promo</p>
        <p className="text-[8px] font-black tracking-tight">Aksesoris pilihan diskon 20%</p>
      </motion.div>

      {/* Categories */}
      <div className="mt-1.5 flex gap-1 overflow-hidden px-2.5">
        {phoneCategories.map((cat) => (
          <button key={cat} type="button" className="relative flex-shrink-0">
            {activeCategory === cat && (
              <motion.span
                layoutId="phone-cat-pill"
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span
              className={cn(
                'relative block rounded-full px-1.5 py-0.5 text-[6.5px] font-bold',
                activeCategory === cat
                  ? 'text-white'
                  : 'border border-surface-200 bg-white text-surface-600',
              )}
            >
              {cat}
            </span>
          </button>
        ))}
      </div>

      {/* Products grid — re-mounts on category change for natural enter anim */}
      <div className="mt-1.5 px-2.5">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 gap-1.5"
          >
            {visible.map((product, i) => (
              <motion.div
                key={`${activeCategory}-${product.name}`}
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                className="overflow-hidden rounded-lg border border-surface-200/70 bg-white p-1 shadow-soft-xs"
              >
                <div
                  className={cn(
                    'relative mb-1 flex h-9 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br',
                    TONE_BG[product.tone],
                  )}
                >
                  <ProductIllustration hint={product.hint} />
                  <span className="absolute left-1 top-1 rounded-sm bg-white/80 px-1 py-px text-[5.5px] font-black uppercase tracking-[0.1em] text-surface-700">
                    {product.hint}
                  </span>
                </div>
                <p className="truncate text-[6.5px] font-bold text-ink">{product.name}</p>
                <p className="text-[6.5px] font-bold text-primary-700">{product.price}</p>
              </motion.div>
            ))}
            {visible.length === 0 && (
              <div className="col-span-2 rounded-lg border border-dashed border-surface-200 bg-white/60 p-2 text-center text-[7px] font-semibold text-surface-500">
                Belum ada produk
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t border-surface-200/70 bg-white px-2 py-1">
        {['🏠', '🛒', '💬', '👤'].map((emoji, i) => (
          <span key={emoji} className={cn('text-[8px]', i === 1 ? 'opacity-100' : 'opacity-50')}>
            {emoji}
          </span>
        ))}
      </div>

      {/* Home indicator */}
      <div className="absolute bottom-0.5 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-surface-300" />

      {/* Virtual cursor */}
      {!reduced && <AnimatedCursor target={cursor} device="phone" />}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   ProductIllustration — tiny inline SVG that hints at the product type
   ------------------------------------------------------------------------- */

function ProductIllustration({ hint }: { hint: string }) {
  if (hint === 'iPhone') return <IPhoneSilhouette />
  if (hint === 'Android') return <AndroidSilhouette />
  return <AccessorySilhouette />
}

function IPhoneSilhouette() {
  return (
    <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden>
      <rect x="14" y="6" width="12" height="28" rx="3" fill="#1f2937" />
      <rect x="15" y="9" width="10" height="22" rx="1.5" fill="#f8fafc" />
      <rect x="18" y="7.5" width="4" height="1.4" rx="0.7" fill="#0f172a" />
      <rect x="16.5" y="11" width="7" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="16.5" y="13.5" width="5" height="1" rx="0.5" fill="#e2e8f0" />
      <rect x="16.5" y="15.5" width="6" height="1" rx="0.5" fill="#e2e8f0" />
    </svg>
  )
}

function AndroidSilhouette() {
  return (
    <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden>
      <rect x="14" y="6" width="12" height="28" rx="3" fill="#0f172a" />
      <rect x="15" y="8.5" width="10" height="23" rx="1.2" fill="#0e7490" />
      <circle cx="20" cy="10.5" r="0.8" fill="#0f172a" />
      <rect x="16.5" y="13" width="7" height="1.2" rx="0.6" fill="#67e8f9" />
      <rect x="16.5" y="15" width="5" height="1" rx="0.5" fill="#a5f3fc" />
      <rect x="16.5" y="17" width="6" height="1" rx="0.5" fill="#a5f3fc" />
    </svg>
  )
}

function AccessorySilhouette() {
  return (
    <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden>
      <rect x="9" y="14" width="9" height="10" rx="2" fill="#1f2937" />
      <rect x="11" y="13.2" width="2.2" height="1.5" rx="0.5" fill="#475569" />
      <rect x="13.5" y="13.2" width="2.2" height="1.5" rx="0.5" fill="#475569" />
      <rect x="11.5" y="16" width="4.5" height="0.9" rx="0.4" fill="#fde68a" />
      <rect x="11.5" y="17.5" width="3" height="0.7" rx="0.4" fill="#fde68a" />
      <circle cx="26" cy="20" r="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.6" />
      <circle cx="26" cy="20" r="2" fill="#e2e8f0" />
      <rect
        x="25"
        y="22"
        width="2"
        height="5"
        rx="0.8"
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth="0.4"
      />
    </svg>
  )
}
