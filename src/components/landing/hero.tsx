'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AnimatedNumber,
  AuroraBackground,
  Magnetic,
  staggerContainer,
  viewportReveal,
} from '@/components/motion'
import {
  ArrowRight,
  CheckCircle,
  Play,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
} from '@/lib/icons'

const trustItems = ['Tanpa kartu kredit', 'Daftar gratis selamanya', 'Rekber aman']

const liveStats = [
  { label: 'Total Teknisi', value: 5000, suffix: '+', prefix: '' },
  { label: 'Transaksi / Bulan', value: 50, suffix: 'M+', prefix: 'Rp ' },
  { label: 'Konsultasi Selesai', value: 10, suffix: 'K+', prefix: '' },
]

const signalBars = [42, 68, 54, 82, 74, 96, 72, 88]

const partners = ['Samsung', 'Xiaomi', 'OPPO', 'Apple', 'Vivo', 'Realme', 'Infinix']

export function Hero() {
  return (
    <section className="relative min-h-[88vh] overflow-hidden pt-28 pb-16 sm:pt-32">
      {/* Premium light aurora */}
      <AuroraBackground intensity="vivid" />

      {/* Vertical fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/70 to-transparent" />

      <motion.div
        className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <div className="text-center lg:text-left">
          <motion.div variants={viewportReveal}>
            <Badge variant="glass" className="mb-6 px-3.5 py-1.5 shadow-soft-xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-500" />
              </span>
              <Sparkles className="h-3.5 w-3.5 text-primary-600" />
              <span className="text-surface-700">5.000+ teknisi & user aktif</span>
            </Badge>
          </motion.div>

          <motion.h1
            variants={viewportReveal}
            className="mx-auto max-w-5xl text-balance text-[40px] font-semibold leading-[1.02] tracking-tightest text-ink sm:text-5xl lg:mx-0 lg:text-[68px]"
          >
            Ekosistem teknisi handphone
            <span className="block">
              yang <span className="gradient-text font-semibold">terintegrasi</span> & cinematic.
            </span>
          </motion.h1>

          <motion.p
            variants={viewportReveal}
            className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-surface-600 sm:text-[17px] lg:mx-0"
          >
            Marketplace, konsultasi, manajemen toko, dan rekber dalam satu platform yang halus, cepat,
            dan dipercaya — dirancang untuk teknisi modern Indonesia.
          </motion.p>

          <motion.div
            variants={viewportReveal}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
          >
            <Magnetic strength={10}>
              <Link href="/register">
                <Button size="lg" variant="primary" className="group w-full sm:w-auto">
                  Mulai gratis
                  <ArrowRight className="h-4 w-4 transition-transform duration-450 group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </Magnetic>
            <Link href="/marketplace">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Play className="h-4 w-4" />
                Lihat marketplace
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={viewportReveal}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-surface-500 lg:justify-start"
          >
            {trustItems.map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-primary-600" />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Live cockpit visual */}
        <motion.div variants={viewportReveal} className="relative">
          <motion.div
            className="relative overflow-hidden rounded-[2rem] border border-surface-200/70 bg-white/90 p-3 shadow-soft-2xl backdrop-blur-md"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Soft inner reflection */}
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/60 via-transparent to-transparent" />

            <div className="relative rounded-[1.45rem] border border-surface-200/70 bg-gradient-to-br from-white to-primary-50/40 p-4">
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary-700">
                    Live cockpit
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-ink">IndoTeknizi Ops</h2>
                </div>
                <Badge variant="primary" className="gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-500" />
                  </span>
                  Online
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid gap-3 sm:grid-cols-3">
                {liveStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="rounded-2xl border border-surface-200/70 bg-white/95 p-4 shadow-soft-xs"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="mb-3 h-1 w-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500" />
                    <p className="text-[11px] font-medium text-surface-500">{stat.label}</p>
                    <AnimatedNumber
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      className="mt-1 block text-[22px] font-semibold tracking-tight-lg text-ink tabular-nums"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Chart + side stats */}
              <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-2xl border border-surface-200/70 bg-white/95 p-4 shadow-soft-xs">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">Transaksi real-time</p>
                      <p className="text-[11px] text-surface-500">Updates setiap menit</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-[11px] font-semibold text-primary-700">
                      <TrendingUp className="h-3 w-3" />
                      +12.5%
                    </div>
                  </div>
                  <div className="flex h-40 items-end gap-1.5">
                    {signalBars.map((height, index) => (
                      <motion.div
                        key={`signal-bar-${index}`}
                        className="flex-1 rounded-t-lg bg-gradient-to-t from-primary-600 via-primary-500 to-primary-300"
                        style={{ minHeight: 4 }}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{
                          delay: 0.7 + index * 0.06,
                          duration: 0.85,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-surface-200/70 bg-white/95 p-4 shadow-soft-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Star weight="fill" className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">4.8/5 rating</p>
                        <p className="text-[11px] text-surface-500">Review terverifikasi</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50 to-white p-4 shadow-soft-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-600 shadow-soft-xs">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">Escrow aktif</p>
                        <p className="text-[11px] text-surface-500">
                          <span className="font-semibold text-primary-700">Rp 2.4M</span> diamankan
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </motion.div>

      {/* Logo / brand strip */}
      <div className="relative mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-surface-500">
          Mendukung perangkat dari brand terpercaya
        </p>
        <div className="marquee-mask flex w-full overflow-hidden">
          <div
            className="flex w-max items-center gap-12 hover:[animation-play-state:paused]"
            style={{ animation: 'marquee 38s linear infinite' }}
          >
            {[...partners, ...partners, ...partners].map((brand, index) => (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={`${brand}-${index}`}
                className="text-base font-semibold tracking-tight text-surface-500 transition-colors hover:text-surface-700"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
