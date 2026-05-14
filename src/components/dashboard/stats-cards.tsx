'use client'

import { motion } from 'framer-motion'
import {
  AnimatedNumber,
  staggerContainerFast,
  viewportRevealNoBlur,
} from '@/components/motion'
import {
  TrendingUp,
  Users,
  UserCheck,
  ShoppingBag,
  MessageCircle,
} from '@/lib/icons'

const stats = [
  {
    title: 'Total User',
    value: 1245,
    delta: 12.5,
    icon: Users,
    accent: 'from-primary-500/15 via-primary-500/5 to-transparent',
  },
  {
    title: 'Total Teknisi',
    value: 234,
    delta: 8.2,
    icon: UserCheck,
    accent: 'from-accent-500/15 via-accent-500/5 to-transparent',
  },
  {
    title: 'Total Transaksi',
    value: 5678,
    delta: 23.1,
    icon: ShoppingBag,
    accent: 'from-violet-500/15 via-violet-500/5 to-transparent',
  },
  {
    title: 'Total Konsultasi',
    value: 3456,
    delta: 15.7,
    icon: MessageCircle,
    accent: 'from-amber-500/15 via-amber-500/5 to-transparent',
  },
] as const

export function StatsCards() {
  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
      variants={staggerContainerFast}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.title}
          variants={viewportRevealNoBlur}
          className="group/stat relative overflow-hidden rounded-2xl border border-surface-200/70 bg-white/85 p-5 shadow-soft-xs backdrop-blur-md transition-all duration-450 ease-out-expo hover:-translate-y-1 hover:shadow-soft-md"
        >
          {/* Accent halo */}
          <div
            aria-hidden
            className={`pointer-events-none absolute -inset-x-6 -top-12 h-32 rounded-full blur-3xl bg-gradient-to-br ${stat.accent}`}
          />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-surface-500">
                {stat.title}
              </p>
              <AnimatedNumber
                value={stat.value}
                className="mt-2 block text-[28px] font-semibold tracking-tightest text-ink tabular-nums"
              />
            </div>

            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary-200/60 bg-gradient-to-br from-white to-primary-50 text-primary-700 shadow-soft-xs transition-transform duration-450 group-hover/stat:-translate-y-0.5">
              <stat.icon className="h-5 w-5" />
            </div>
          </div>

          {/* Trend pill */}
          <div className="relative mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700 ring-1 ring-inset ring-primary-200/70">
              <TrendingUp className="h-3 w-3" />+{stat.delta}%
            </span>
            <span className="text-[11px] text-surface-500">vs bulan lalu</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
