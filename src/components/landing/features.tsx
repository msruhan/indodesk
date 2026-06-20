'use client'

import Link from 'next/link'
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
  Send,
  Users,
  Smartphone,
  Globe,
  Scales,
  Zap,
} from '@/lib/icons'

const features = [
  {
    icon: Smartphone,
    title: 'Marketplace Terintegrasi',
    description:
      'Jual beli handphone, laptop, dan aksesoris dengan rating & review yang terpercaya.',
    accent: 'from-primary-500/20 via-primary-400/15 to-transparent',
  },
  {
    icon: Users,
    title: 'Teknisi Online',
    description:
      'Konsultasi langsung dengan teknisi handphone berpengalaman secara real-time. Dari diagnosa hingga hardware repair.',
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
    icon: Send,
    title: 'Notifikasi Telegram',
    description:
      'Teknisi dapat alert langsung ke Telegram: pesanan marketplace baru, permintaan konsultasi, dan request inspeksi dari pelanggan — real-time, tidak ketinggalan.',
    accent: 'from-sky-500/20 via-sky-400/15 to-transparent',
  },
  {
    icon: Scales,
    title: 'Benchmark Produk',
    description:
      'Bandingkan dua iklan side-by-side — kondisi, spesifikasi, hardware, dan kelengkapan dinilai otomatis. Dapatkan skor total & rekomendasi pemenang.',
    accent: 'from-emerald-500/20 via-emerald-400/15 to-transparent',
    href: '/marketplace/bandingkan',
    cta: 'Bandingkan',
  },
  {
    icon: Globe,
    title: 'Chat Real-time',
    description:
      'Komunikasi langsung antara user, teknisi, dan admin. Dengan indikator online/offline dan unread counter.',
    accent: 'from-cyan-500/20 via-cyan-400/15 to-transparent',
  },
] as const satisfies ReadonlyArray<{
  icon: typeof Smartphone
  title: string
  description: string
  accent: string
  href?: string
  cta?: string
}>

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
           Semua yang Anda butuhkan untuk bisnis handphone — dalam satu antarmuka yang lengkap, terpusat, dan dipercaya.
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

                  {/* Subtle CTA on hover */}
                  {'href' in feature && feature.href ? (
                    <Link
                      href={feature.href}
                      className="mt-5 inline-flex items-center text-[13px] font-medium text-primary-700 opacity-70 transition-opacity duration-300 group-hover/spot:opacity-100"
                    >
                      {'cta' in feature && feature.cta ? feature.cta : 'Pelajari'}
                      <span
                        aria-hidden
                        className="ml-1 inline-block transition-transform duration-450 group-hover/spot:translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  ) : (
                    <div className="mt-5 flex items-center text-[13px] font-medium text-primary-700 opacity-70 transition-opacity duration-300 group-hover/spot:opacity-100">
                      Pelajari
                      <span
                        aria-hidden
                        className="ml-1 inline-block transition-transform duration-450 group-hover/spot:translate-x-1"
                      >
                        →
                      </span>
                    </div>
                  )}
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
