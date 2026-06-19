'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Award, Scales } from '@/lib/icons'
import { AnimatedNumber } from '@/components/motion'
import { cn } from '@/lib/utils'

type Props = { className?: string }

const ease = [0.22, 1, 0.36, 1] as const

const pillars = [
  { label: 'Kondisi', weight: '30%', scoreA: 92, scoreB: 68 },
  { label: '3uTools', weight: '25%', scoreA: 88, scoreB: 72 },
  { label: 'Spesifikasi', weight: '25%', scoreA: 100, scoreB: 75 },
]

/**
 * Compare Products Illustration — dua unit dibandingkan side-by-side
 * dengan skor total animasi + breakdown pilar objektif.
 */
export function CompareProductsIllustration({ className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(rootRef, { once: true, margin: '-40px' })

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative flex aspect-[4/3] w-full flex-col overflow-hidden rounded-3xl border border-primary-200/70 p-3 sm:p-4',
        'bg-gradient-to-br from-white via-primary-50/40 to-emerald-50/30',
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-12 -top-16 h-56 w-56 rounded-full bg-primary-300/30 blur-3xl"
        animate={isInView ? { scale: [1, 1.08, 1], opacity: [0.2, 0.32, 0.2] } : undefined}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -right-12 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl"
        animate={isInView ? { scale: [1, 1.1, 1], opacity: [0.15, 0.28, 0.15] } : undefined}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />

      {/* Header chip */}
      <motion.div
        className="relative z-10 mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-primary-200/80 bg-white/95 px-2.5 py-1 shadow-soft-xs backdrop-blur-sm"
        initial={{ opacity: 0, y: -6 }}
        animate={isInView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.45, ease }}
      >
        <Scales className="h-3 w-3 text-primary-600" weight="fill" />
        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-primary-700">
          Benchmark
        </span>
      </motion.div>

      {/* Product cards + VS */}
      <div className="relative z-10 grid flex-shrink-0 grid-cols-[1fr_auto_1fr] items-stretch gap-1.5 sm:gap-2">
        <ProductMiniCard
          name="iPhone 12"
          storage="128GB"
          price="5,8 jt"
          score={94.3}
          winner
          delay={0.15}
          scoreDelay={0.75}
          imageGradient="from-slate-100 to-slate-200"
          isInView={isInView}
        />

        <motion.div
          className="flex items-center justify-center self-center"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : undefined}
          transition={{ delay: 0.45, type: 'spring', stiffness: 320, damping: 22 }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-primary-500 to-emerald-600 text-[9px] font-black text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.5)] sm:h-8 sm:w-8 sm:text-[10px]">
            VS
          </span>
        </motion.div>

        <ProductMiniCard
          name="iPhone 11"
          storage="64GB"
          price="4,2 jt"
          score={70.4}
          delay={0.27}
          scoreDelay={0.95}
          imageGradient="from-neutral-800 to-neutral-950"
          isInView={isInView}
        />
      </div>

      {/* Breakdown panel */}
      <motion.div
        className="relative z-10 mt-2 flex min-h-0 flex-1 flex-col rounded-2xl border border-surface-200/80 bg-white/95 p-2.5 shadow-[0_12px_32px_-16px_rgba(16,185,129,0.3)] backdrop-blur-sm sm:mt-3 sm:p-3"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 1.1, duration: 0.5, ease }}
      >
        <p className="mb-1.5 text-[8.5px] font-black uppercase tracking-[0.14em] text-surface-500 sm:mb-2">
          Breakdown per kategori
        </p>
        <div className="space-y-1.5 sm:space-y-2">
          {pillars.map((p, i) => (
            <PillarRow key={p.label} {...p} index={i} isInView={isInView} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function ProductMiniCard({
  name,
  storage,
  price,
  score,
  winner = false,
  delay,
  scoreDelay,
  imageGradient,
  isInView,
}: {
  name: string
  storage: string
  price: string
  score: number
  winner?: boolean
  delay: number
  scoreDelay: number
  imageGradient: string
  isInView: boolean
}) {
  return (
    <motion.div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-soft-xs',
        winner
          ? 'border-primary-400 ring-2 ring-primary-300/50 shadow-[0_0_18px_-6px_rgba(16,185,129,0.35)]'
          : 'border-surface-200/80',
      )}
      initial={{ opacity: 0, y: 14 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay, duration: 0.5, ease }}
    >
      {winner && (
        <motion.span
          className="absolute right-1.5 top-1.5 z-10 inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.1em] text-white shadow-soft-xs sm:text-[8px]"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : undefined}
          transition={{ delay: 2.1, type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Award className="h-2 w-2 sm:h-2.5 sm:w-2.5" weight="fill" />
          Terbaik
        </motion.span>
      )}

      <div className={cn('relative aspect-[5/4] bg-gradient-to-br sm:aspect-[4/3]', imageGradient)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[68%] w-[40%] rounded-[8px] border border-white/20 bg-black/10 shadow-inner sm:rounded-[10px]" />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 py-1.5">
        <p className="truncate text-[8.5px] font-bold text-ink sm:text-[9px]">
          {name} {storage}
        </p>
        <p className="text-[7.5px] font-semibold text-surface-500 sm:text-[8px]">Rp {price}</p>
        <div
          className={cn(
            'mt-auto rounded-lg px-2 py-1 text-center',
            winner ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white' : 'bg-surface-100 text-surface-600',
          )}
        >
          <p className="text-[6.5px] font-bold uppercase tracking-[0.12em] opacity-80 sm:text-[7px]">
            Skor total
          </p>
          {isInView ? (
            <AnimatedNumber
              value={score}
              decimals={1}
              delay={scoreDelay}
              duration={1.2}
              className="text-xs font-black tabular-nums sm:text-sm"
            />
          ) : (
            <span className="text-xs font-black tabular-nums sm:text-sm">0.0</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function PillarRow({
  label,
  weight,
  scoreA,
  scoreB,
  index,
  isInView,
}: {
  label: string
  weight: string
  scoreA: number
  scoreB: number
  index: number
  isInView: boolean
}) {
  const winnerA = scoreA >= scoreB
  const barDelay = 1.3 + index * 0.12

  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[7.5px] sm:text-[8px]">
        <span className="font-bold text-ink">{label}</span>
        <span className="text-surface-400">bobot {weight}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {/* A — bar ke kanan */}
        <div className="flex items-center gap-1">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-100 sm:h-2">
            <motion.div
              className={cn(
                'h-full rounded-full',
                winnerA
                  ? 'bg-gradient-to-r from-primary-500 to-emerald-500'
                  : 'bg-surface-300',
              )}
              initial={{ width: 0 }}
              animate={isInView ? { width: `${scoreA}%` } : undefined}
              transition={{ delay: barDelay, duration: 0.75, ease }}
            />
          </div>
          <span
            className={cn(
              'w-5 text-right text-[7.5px] font-bold tabular-nums sm:w-6 sm:text-[8px]',
              winnerA ? 'text-primary-700' : 'text-surface-500',
            )}
          >
            {scoreA}
          </span>
        </div>
        {/* B — bar ke kiri */}
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'w-5 text-[7.5px] font-bold tabular-nums sm:w-6 sm:text-[8px]',
              !winnerA ? 'text-primary-700' : 'text-surface-500',
            )}
          >
            {scoreB}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-100 sm:h-2">
            <motion.div
              className={cn(
                'ml-auto h-full rounded-full',
                !winnerA
                  ? 'bg-gradient-to-l from-primary-500 to-emerald-500'
                  : 'bg-surface-300',
              )}
              initial={{ width: 0 }}
              animate={isInView ? { width: `${scoreB}%` } : undefined}
              transition={{ delay: barDelay + 0.06, duration: 0.75, ease }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
