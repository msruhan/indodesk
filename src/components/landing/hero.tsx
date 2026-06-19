'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CrossPlatformMockup } from '@/components/landing/cross-platform-mockup'
import {
  AuroraBackground,
  Magnetic,
  staggerContainer,
  viewportReveal,
} from '@/components/motion'
import { cn } from '@/lib/utils'
import { ArrowRight, CheckCircle, Play, Sparkles } from '@/lib/icons'

const ROTATE_MS = 8000

const heroVariants = [
  {
    id: 'buyer',
    badge: 'Transaksi aman platform',
    lines: ['Beli HP second takut zonk?', 'Kami bantoo-in pilih yang paling oke.'],
    highlightLine: 1,
    description:
      'Beli dari teknisi & toko terverifikasi — inspeksi, konsultasi, transaksi aman.',
    trustItems: ['Teknisi verified', 'Transaksi aman', 'Inspeksi tersedia'],
    primaryCta: { label: 'Cari handphone', href: '/marketplace' },
    secondaryCta: { label: 'Daftar gratis', href: '/register' },
  },
  {
    id: 'seller',
    badge: '3.000+ teknisi & toko aktif',
    lines: ['Fee toko ijo & oren bikin pusing?', 'Kami bantoo-in jual dengan fee rendah.'],
    highlightLine: 1,
    description:
      'Komisi rendah, buyer ekosistem teknisi, transaksi aman — jual, konsultasi, transaksi.',
    trustItems: ['Komisi rendah', 'Buyer teknisi', 'Transaksi aman'],
    primaryCta: { label: 'Mulai jual gratis', href: '/register/teknisi' },
    secondaryCta: { label: 'Lihat marketplace', href: '/marketplace' },
  },
  {
    id: 'teknisi',
    badge: 'Bangun reputasi teknisi & toko HP',
    lines: ['Pengen portofolio yang keliatan pro?', 'Daftar &kami bantoo-in bangun profilmu.'],
    highlightLine: 1,
    description:
      'Profil toko, katalog, dan sertifikasi — keliatan pro dari hari pertama.',
    trustItems: ['Profil toko', 'Katalog produk', 'Sertifikasi'],
    primaryCta: { label: 'Daftar sebagai teknisi', href: '/register/teknisi' },
    secondaryCta: { label: 'Lihat teknisi', href: '/teknisi' },
  },
] as const

const SLIDE_ARIA_LABELS: Record<(typeof heroVariants)[number]['id'], string> = {
  buyer: 'Tampilkan pesan pembeli',
  seller: 'Tampilkan pesan penjual',
  teknisi: 'Tampilkan pesan teknisi',
}

const partners = ['Samsung', 'Xiaomi', 'OPPO', 'Apple', 'Vivo', 'Realme', 'Infinix']

const textFade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } },
}

export function Hero() {
  const [activeIdx, setActiveIdx] = useState(0)
  const variant = heroVariants[activeIdx]!

  const goTo = useCallback((idx: number) => {
    setActiveIdx(idx % heroVariants.length)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % heroVariants.length)
    }, ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-[88vh] overflow-hidden pt-28 pb-16 sm:pt-32">
      <AuroraBackground intensity="vivid" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/70 to-transparent" />

      <motion.div
        className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <div className="text-center lg:text-left">
          <motion.div variants={viewportReveal}>
            <AnimatePresence mode="wait">
              <motion.div key={`badge-${variant.id}`} {...textFade}>
                <Badge variant="glass" className="mb-6 px-3.5 py-1.5 shadow-soft-xs">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-500" />
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-primary-600" />
                  <span className="text-surface-700">{variant.badge}</span>
                </Badge>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.h1
              key={`headline-${variant.id}`}
              {...textFade}
              className="mx-auto max-w-5xl text-balance text-[36px] font-semibold leading-[1.06] tracking-tightest text-ink sm:text-5xl lg:mx-0 lg:text-[60px]"
            >
              {variant.lines.map((line, lineIdx) => (
                <span key={line} className="block">
                  {lineIdx === variant.highlightLine ? (
                    <span className="gradient-text font-semibold">{line}</span>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </motion.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={`desc-${variant.id}`}
              {...textFade}
              className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-surface-600 sm:text-[17px] lg:mx-0"
            >
              {variant.description}
            </motion.p>
          </AnimatePresence>

          <motion.div
            variants={viewportReveal}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
          >
            <Magnetic strength={10}>
              <Link href={variant.primaryCta.href}>
                <Button size="lg" variant="primary" className="group w-full sm:w-auto">
                  {variant.primaryCta.label}
                  <ArrowRight className="h-4 w-4 transition-transform duration-450 group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </Magnetic>
            <Link href={variant.secondaryCta.href}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Play className="h-4 w-4" />
                {variant.secondaryCta.label}
              </Button>
            </Link>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`trust-${variant.id}`}
              {...textFade}
              className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-surface-500 lg:justify-start"
            >
              {variant.trustItems.map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-primary-600" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex items-center justify-center gap-2 lg:justify-start">
            {heroVariants.map((v, idx) => (
              <button
                key={v.id}
                type="button"
                aria-label={SLIDE_ARIA_LABELS[v.id]}
                onClick={() => goTo(idx)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  activeIdx === idx ? 'w-6 bg-primary-600' : 'w-1.5 bg-surface-300 hover:bg-surface-400',
                )}
              />
            ))}
          </div>
        </div>

        <motion.div variants={viewportReveal} className="relative">
          <CrossPlatformMockup />
          <div
            aria-hidden
            className="aurora-blob aurora-blob-emerald pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 opacity-40"
          />
        </motion.div>
      </motion.div>

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
