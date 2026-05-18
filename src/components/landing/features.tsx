'use client'

import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  Reveal,
  SpotlightCard,
  staggerContainer,
  viewportReveal,
} from '@/components/motion'
import {
  Briefcase,
  Clock,
  Users,
  Smartphone,
  Globe,
  Shield,
  Zap,
} from '@/lib/icons'

const features = [
  {
    icon: Smartphone,
    title: 'Marketplace Terintegrasi',
    description:
      'Jual beli handphone, laptop, aksesoris, dan software tools dengan rating & review yang terpercaya.',
    accent: 'from-primary-500/20 via-primary-400/15 to-transparent',
  },
  {
    icon: Users,
    title: 'Teknisi Online',
    description:
      'Konsultasi langsung dengan teknisi handphone berpengalaman secara real-time. Dari unlock hingga hardware repair.',
    accent: 'from-accent-500/20 via-accent-400/15 to-transparent',
  },
  {
    icon: Briefcase,
    title: 'Promosi Toko',
    description:
      'Platform untuk toko handphone promosi layanan service, jual beli, dengan sistem review dan badge terpercaya.',
    accent: 'from-violet-500/15 via-violet-400/10 to-transparent',
  },
  {
    icon: Clock,
    title: 'Lowongan Kerja',
    description:
      'Cari kesempatan karir sebagai teknisi handphone. Banyak lowongan dari toko dan service center terpercaya.',
    accent: 'from-amber-400/20 via-amber-300/15 to-transparent',
  },
  {
    icon: Shield,
    title: 'Jasa Rekber (Escrow)',
    description:
      'Transaksi aman dengan sistem rekening bersama. Buyer dan seller terlindungi dengan mediator admin.',
    accent: 'from-emerald-500/20 via-emerald-400/15 to-transparent',
  },
  {
    icon: Globe,
    title: 'Chat System Real-time',
    description:
      'Komunikasi langsung antara user, teknisi, dan admin. Dengan indikator online/offline dan unread counter.',
    accent: 'from-cyan-500/20 via-cyan-400/15 to-transparent',
  },
] as const

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden py-24 lg:py-32">
      {/* Soft section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface-50/40 to-white" />
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[480px] max-w-5xl mesh-bg-soft opacity-80" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal className="mx-auto mb-16 max-w-3xl text-center">
          <Badge variant="primary" className="mb-4">
            <Zap className="h-3 w-3" /> Features
          </Badge>
          <h2 className="text-balance text-[34px] font-semibold leading-[1.05] tracking-tightest text-ink sm:text-5xl">
            Platform lengkap untuk
            <span className="gradient-text-static"> ekosistem teknisi</span>
          </h2>
          <p className="mt-4 text-pretty text-base text-surface-600 sm:text-lg">
            Semua yang Anda butuhkan untuk bisnis handphone — dalam satu antarmuka yang terasa cepat,
            elegan, dan dipercaya.
          </p>
        </Reveal>

        {/* Grid */}
        <motion.div
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={viewportReveal}>
              <SpotlightCard tone="primary" className="h-full">
                {/* Soft accent halo per card */}
                <div
                  className={`pointer-events-none absolute -inset-x-6 -top-12 h-32 rounded-full blur-3xl bg-gradient-to-br ${feature.accent}`}
                  aria-hidden
                />

                <div className="relative">
                  {/* Icon — premium tile */}
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary-200/60 bg-gradient-to-br from-white to-primary-50 text-primary-700 shadow-soft-xs transition-transform duration-450 group-hover/spot:-translate-y-0.5 group-hover/spot:scale-[1.05]">
                    <feature.icon className="h-[22px] w-[22px]" />
                  </div>

                  <h3 className="text-[17px] font-semibold tracking-tight-lg text-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-600">
                    {feature.description}
                  </p>

                  {/* Subtle "learn more" affordance on hover */}
                  <div className="mt-5 flex items-center text-[13px] font-medium text-primary-700 opacity-70 transition-opacity duration-300 group-hover/spot:opacity-100">
                    Pelajari
                    <span
                      aria-hidden
                      className="ml-1 inline-block transition-transform duration-450 group-hover/spot:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Cross-Platform highlight */}
        <div className="mt-24 grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Badge variant="gradient" className="mb-4">
              Cross-platform
            </Badge>
            <h3 className="text-balance text-[28px] font-semibold leading-[1.1] tracking-tightest text-ink lg:text-[40px]">
              Akses dari mana saja,
              <br />
              <span className="gradient-text-static">kapan saja</span>
            </h3>
            <p className="mt-4 max-w-xl text-base text-surface-600 sm:text-lg">
              Web dan mobile yang selalu tersinkronisasi. Kelola marketplace, konsultasi, dan transaksi
              Anda dari perangkat apa pun.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {[
                { icon: Smartphone, label: 'Mobile App' },
                { icon: Globe, label: 'Web App' },
                { icon: Zap, label: 'Real-time Sync' },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-surface-200/70 bg-white/80 px-3 py-1.5 text-[13px] font-medium text-surface-700 shadow-soft-xs backdrop-blur-md"
                >
                  <chip.icon className="h-3.5 w-3.5 text-primary-600" />
                  {chip.label}
                </span>
              ))}
            </div>
          </Reveal>

          {/* Device mockups */}
          <Reveal className="relative">
            <motion.div
              className="overflow-hidden rounded-[1.6rem] border border-surface-200/70 bg-gradient-to-br from-surface-900 to-surface-950 p-2 shadow-soft-xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="aspect-[16/10] rounded-[1.2rem] bg-white p-4">
                <div className="mb-3 flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-300" />
                  <span className="h-2 w-2 rounded-full bg-amber-300" />
                  <span className="h-2 w-2 rounded-full bg-primary-300" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1 space-y-2">
                    <div className="h-3 rounded bg-surface-100" />
                    <div className="h-3 w-3/4 rounded bg-surface-100" />
                    <div className="h-3 w-1/2 rounded bg-surface-100" />
                    <div className="mt-3 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100" />
                  </div>
                  <div className="col-span-2 rounded-xl bg-surface-50 p-3">
                    <div className="mb-2 h-20 rounded-lg bg-gradient-to-br from-primary-200/80 via-primary-100 to-accent-100" />
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-12 rounded-lg bg-white shadow-soft-xs" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Phone mockup */}
            <motion.div
              className="absolute -bottom-8 -right-4 z-20 w-32"
              animate={{ y: [0, 10, 0], rotate: [-2, 2, -2] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="rounded-[1.6rem] border border-surface-200/70 bg-gradient-to-br from-surface-900 to-surface-950 p-1.5 shadow-soft-xl">
                <div className="aspect-[9/19] rounded-[1.1rem] bg-white p-2">
                  <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-surface-200" />
                  <div className="space-y-1.5">
                    <div className="h-8 rounded-lg bg-gradient-to-r from-primary-100 to-accent-100" />
                    <div className="h-2 rounded bg-surface-100" />
                    <div className="h-2 w-3/4 rounded bg-surface-100" />
                    <div className="mt-2 h-6 rounded-lg bg-surface-50" />
                    <div className="h-6 rounded-lg bg-surface-50" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Background glow */}
            <div className="aurora-blob aurora-blob-emerald absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 opacity-50" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
