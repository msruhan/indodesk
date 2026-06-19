'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {
  AnimatedNumber,
  Reveal,
  SpotlightCard,
  staggerContainer,
  viewportReveal,
} from '@/components/motion'
import {
  TrendingUp,
  Shield,
  Clock,
  Heart,
  ArrowRight,
  CheckCircle2,
} from '@/lib/icons'

const benefits = [
  {
    icon: TrendingUp,
    title: 'Komisi Lebih Masuk Akal',
    description:
      'Jual handphone dengan komisi marketplace mulai 3–5% (Pro: 1–2%) — margin tetap terjaga dibanding platform umum.',
    stat: 3,
    statSuffix: '%',
    statPrefix: 'Mulai ',
    statLabel: 'komisi marketplace',
  },
  {
    icon: Clock,
    title: 'Konsultasi Lebih Cepat',
    description:
      'Selesaikan masalah handphone dengan lebih cepat melalui konsultasi online real-time dengan teknisi berpengalaman.',
    stat: 3,
    statSuffix: 'x',
    statPrefix: '',
    statLabel: 'lebih cepat',
  },
  {
    icon: Shield,
    title: 'Transaksi Aman',
    description:
      'Sistem rekber (escrow) melindungi buyer dan seller. Transaksi dilakukan dengan aman melalui mediator admin.',
    stat: 100,
    statSuffix: '%',
    statPrefix: '',
    statLabel: 'transaksi aman',
  },
  {
    icon: Heart,
    title: 'Komunitas Terpercaya',
    description:
      'Komunitas teknisi handphone terbesar di Indonesia. Rating & review membantu membangun kepercayaan.',
    stat: 3000,
    statSuffix: '+',
    statPrefix: '',
    statLabel: 'anggota aktif',
  },
] as const

const checklistItems = [
  'Marketplace terintegrasi',
  'Konsultasi online real-time',
  'Sistem rekber aman',
  'Rating & review terpercaya',
  'Lowongan kerja teknisi',
  'Chat real-time',
] as const

type TrustStat = {
  label: string
  value: number
  suffix: string
  prefix?: string
  decimals?: number
}

const trustStats: TrustStat[] = [
  { label: 'User aktif', value: 3000, suffix: '+' },
  { label: 'Teknisi terverifikasi', value: 500, suffix: '+' },
  { label: 'Konsultasi selesai', value: 10000, suffix: '+' },
  { label: 'Rating user', value: 4.8, suffix: '/5', decimals: 1 },
]

export function Benefits() {
  return (
    <section id="benefits" className="relative overflow-hidden py-24 lg:py-32">
      {/* Premium light backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/40 to-white" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto h-[460px] max-w-6xl mesh-bg-soft opacity-90" />
      <div className="aurora-blob aurora-blob-emerald pointer-events-none absolute -left-24 top-12 h-[420px] w-[420px] opacity-40" />
      <div className="aurora-blob aurora-blob-cyan pointer-events-none absolute -right-24 bottom-8 h-[420px] w-[420px] opacity-35" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal className="mx-auto mb-16 max-w-3xl text-center">
          <Badge variant="gradient" className="mb-4">
            Benefits
          </Badge>
          <h2 className="text-balance text-[34px] font-semibold leading-[1.05] tracking-tightest text-ink sm:text-5xl">
            Jual untung. Beli tenang.
            <span className="gradient-text-static"> Dibantoo-in.</span>
          </h2>
          <p className="mt-4 text-pretty text-base text-surface-600 sm:text-lg">
            Seller: fee marketplace lebih masuk akal. Buyer: rekber & teknisi terverifikasi. Satu
            platform untuk ekosistem teknisi handphone Indonesia.
          </p>
        </Reveal>

        {/* Benefits grid */}
        <motion.div
          className="mb-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {benefits.map((b) => (
            <motion.div key={b.title} variants={viewportReveal}>
              <SpotlightCard tone="primary" className="h-full">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary-200/60 bg-gradient-to-br from-white to-primary-50 text-primary-700 shadow-soft-xs">
                  <b.icon className="h-[22px] w-[22px]" />
                </div>

                <div className="mb-3">
                  <AnimatedNumber
                    value={b.stat}
                    prefix={b.statPrefix}
                    suffix={b.statSuffix}
                    className="block text-3xl font-bold tracking-tightest text-ink tabular-nums"
                  />
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-surface-500">
                    {b.statLabel}
                  </p>
                </div>

                <h3 className="text-[17px] font-semibold tracking-tight-lg text-ink">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600">{b.description}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Premium CTA panel */}
        <Reveal className="relative overflow-hidden rounded-[2rem] border border-surface-200/70 bg-white/85 p-8 shadow-soft-lg backdrop-blur-md lg:p-12">
          {/* Decorative aurora inside the panel */}
          <div className="aurora-blob aurora-blob-emerald pointer-events-none absolute -left-12 -top-12 h-72 w-72 opacity-40" />
          <div className="aurora-blob aurora-blob-cyan pointer-events-none absolute -right-16 -bottom-16 h-72 w-72 opacity-30" />
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-30" />

          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-balance text-[26px] font-semibold leading-[1.1] tracking-tightest text-ink lg:text-[34px]">
                Siap mengembangkan bisnis teknisi Anda?
              </h3>
              <p className="mt-3 max-w-xl text-base text-surface-600">
                Bergabunglah dengan ribuan teknisi dan toko yang sudah menggunakan Bantoo.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {checklistItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl border border-surface-200/60 bg-white/70 px-3 py-2 text-sm text-surface-700 backdrop-blur-md"
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7">
                <Button variant="primary" size="lg" className="group">
                  Mulai sekarang
                  <ArrowRight className="h-4 w-4 transition-transform duration-450 group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </div>

            {/* Trust stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {trustStats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-surface-200/70 bg-white/95 p-5 text-center shadow-soft-xs"
                >
                  <AnimatedNumber
                    value={s.value}
                    suffix={s.suffix}
                    prefix={s.prefix ?? ''}
                    decimals={s.decimals ?? 0}
                    className="block text-2xl font-semibold tracking-tightest text-ink tabular-nums lg:text-3xl"
                  />
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-surface-500">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
