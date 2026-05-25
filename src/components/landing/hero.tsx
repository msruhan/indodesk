'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CrossPlatformMockup } from '@/components/landing/cross-platform-mockup'
import {
  AuroraBackground,
  Magnetic,
  staggerContainer,
  viewportReveal,
} from '@/components/motion'
import { ArrowRight, CheckCircle, Play, Sparkles } from '@/lib/icons'

const trustItems = ['Komunitas solid', 'Bisnis berkembang', 'Rekber aman']

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
              <span className="text-surface-700">3.000+ teknisi & user aktif</span>
            </Badge>
          </motion.div>

          <motion.h1
            variants={viewportReveal}
            className="mx-auto max-w-5xl text-balance text-[40px] font-semibold leading-[1.02] tracking-tightest text-ink sm:text-5xl lg:mx-0 lg:text-[68px]"
          >
            Satu platform untuk bisnis
            <span className="block">
              teknisi handphone{' '}
              <span className="gradient-text font-semibold">yang lengkap</span>.
            </span>
          </motion.h1>

          <motion.p
            variants={viewportReveal}
            className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-surface-600 sm:text-[17px] lg:mx-0"
          >
            Jualan di marketplace, terima konsultasi hingga layanan remote, dan transaksi aman lewat
            rekber—semua dalam satu tempat untuk ekosistem teknisi Indonesia.
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

        {/* Tablet dashboard + phone shop */}
        <motion.div variants={viewportReveal} className="relative">
          <CrossPlatformMockup />
          <div
            aria-hidden
            className="aurora-blob aurora-blob-emerald pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 opacity-40"
          />
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
