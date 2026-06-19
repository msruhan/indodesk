'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Award, Scales, Sparkles } from '@/lib/icons'
import { cn } from '@/lib/utils'

type Props = { className?: string }

const pillars = [
  { label: 'Kondisi', weight: '30%', scoreA: 92, scoreB: 68 },
  { label: '3uTools', weight: '25%', scoreA: 88, scoreB: 72 },
  { label: 'Spesifikasi', weight: '25%', scoreA: 100, scoreB: 75 },
]

function AnimatedScore({
  target,
  delay = 0,
  className,
}: {
  target: number
  delay?: number
  className?: string
}) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => v.toFixed(1))
  const [text, setText] = useState('0.0')

  useEffect(() => {
    const controls = animate(motionValue, target, {
      duration: 1.8,
      delay,
      ease: [0.16, 1, 0.3, 1],
    })
    return () => controls.stop()
  }, [target, delay, motionValue])

  useEffect(() => rounded.on('change', (v) => setText(v)), [rounded])

  return <span className={className}>{text}</span>
}

/**
 * Compare Products Illustration — dua unit dibandingkan side-by-side
 * dengan skor total animasi + breakdown pilar objektif.
 */
export function CompareProductsIllustration({ className }: Props) {
  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-primary-200/70',
        'bg-gradient-to-br from-white via-primary-50/40 to-emerald-50/30',
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="absolute -left-12 -top-16 h-56 w-56 rounded-full bg-primary-300/35 blur-3xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.42, 0.25] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-16 -right-12 h-56 w-56 rounded-full bg-emerald-300/30 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.38, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />

      {/* Header chip */}
      <motion.div
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-primary-200/80 bg-white/95 px-2.5 py-1 shadow-soft-xs backdrop-blur-sm"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Scales className="h-3 w-3 text-primary-600" weight="fill" />
        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-primary-700">
          Benchmark
        </span>
      </motion.div>

      {/* VS badge center */}
      <motion.div
        className="absolute left-1/2 top-[38%] z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-primary-500 to-emerald-600 text-[10px] font-black text-white shadow-[0_8px_24px_-6px_rgba(16,185,129,0.55)]"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 280 }}
      >
        VS
      </motion.div>

      {/* Product cards */}
      <div className="absolute inset-x-3 top-[14%] grid grid-cols-2 gap-2 sm:inset-x-4 sm:gap-3">
        <ProductMiniCard
          name="iPhone 12"
          storage="128GB"
          price="5,8 jt"
          score={94.3}
          winner
          delay={0.2}
          imageGradient="from-slate-100 to-slate-200"
        />
        <ProductMiniCard
          name="iPhone 11"
          storage="64GB"
          price="4,2 jt"
          score={70.4}
          delay={0.35}
          imageGradient="from-neutral-800 to-neutral-950"
        />
      </div>

      {/* Breakdown panel */}
      <motion.div
        className="absolute inset-x-3 bottom-3 rounded-2xl border border-surface-200/80 bg-white/95 p-2.5 shadow-[0_18px_40px_-18px_rgba(16,185,129,0.35)] backdrop-blur-sm sm:inset-x-4 sm:bottom-4 sm:p-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.55 }}
      >
        <p className="mb-2 text-[8.5px] font-black uppercase tracking-[0.14em] text-surface-500">
          Breakdown per kategori
        </p>
        <div className="space-y-2">
          {pillars.map((p, i) => (
            <PillarRow key={p.label} {...p} index={i} />
          ))}
        </div>
      </motion.div>

      {/* Winner pulse */}
      <motion.div
        className="absolute left-[18%] top-[52%] z-10"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 1, 1, 0.85], scale: [0.5, 1.1, 1, 1] }}
        transition={{ delay: 2.2, duration: 0.6, repeat: Infinity, repeatDelay: 2.5 }}
      >
        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-600 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-white shadow-md">
          <Award className="h-2.5 w-2.5" weight="fill" />
          Terbaik
        </span>
      </motion.div>

      <div className="absolute bottom-[42%] right-4 hidden sm:block">
        <motion.div
          animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="h-5 w-5 text-amber-400" weight="fill" />
        </motion.div>
      </div>
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
  imageGradient,
}: {
  name: string
  storage: string
  price: string
  score: number
  winner?: boolean
  delay: number
  imageGradient: string
}) {
  return (
    <motion.div
      className={cn(
        'overflow-hidden rounded-xl border bg-white shadow-soft-xs',
        winner ? 'border-primary-400 ring-1 ring-primary-400/40' : 'border-surface-200/80',
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={cn('relative aspect-[4/3] bg-gradient-to-br', imageGradient)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[70%] w-[42%] rounded-[10px] border border-white/20 bg-black/10 shadow-inner" />
        </div>
        {winner && (
          <motion.span
            className="absolute left-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.5, type: 'spring' }}
          >
            <Award className="h-3 w-3" weight="fill" />
          </motion.span>
        )}
      </div>
      <div className="px-2 py-1.5">
        <p className="truncate text-[9px] font-bold text-ink">
          {name} {storage}
        </p>
        <p className="text-[8px] font-semibold text-surface-500">Rp {price}</p>
        <div
          className={cn(
            'mt-1.5 rounded-lg px-2 py-1 text-center',
            winner ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600',
          )}
        >
          <p className="text-[7px] font-bold uppercase tracking-[0.12em] opacity-80">Skor total</p>
          <AnimatedScore
            target={score}
            delay={delay + 0.8}
            className="text-sm font-black tabular-nums"
          />
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
}: {
  label: string
  weight: string
  scoreA: number
  scoreB: number
  index: number
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[8px]">
        <span className="font-bold text-ink">{label}</span>
        <span className="text-surface-400">bobot {weight}</span>
      </div>
      <div className="space-y-0.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${scoreA}%` }}
            transition={{ delay: 0.9 + index * 0.15, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-100">
          <motion.div
            className="h-full rounded-full bg-surface-300"
            initial={{ width: 0 }}
            animate={{ width: `${scoreB}%` }}
            transition={{ delay: 1.05 + index * 0.15, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </div>
  )
}
