'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, CheckCircle } from '@/lib/icons'
import { Reveal, Magnetic } from '@/components/motion'
import { motion } from 'framer-motion'

const trustItems = ['Komisi ringan', 'Transaksi aman', 'Teknisi verified'] as const

export function CTA() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      {/* Light premium backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/30 to-white" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.25rem] border border-surface-200/70 bg-white/85 px-6 py-14 text-center shadow-soft-2xl backdrop-blur-md sm:px-12 lg:px-16 lg:py-20">
            {/* Aurora glow inside the panel */}
            <motion.div
              className="aurora-blob aurora-blob-emerald pointer-events-none absolute -left-20 -top-20 h-[420px] w-[420px] opacity-50"
              animate={{ x: [0, 20, -10, 0], y: [0, -10, 12, 0] }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="aurora-blob aurora-blob-cyan pointer-events-none absolute -right-24 -bottom-24 h-[460px] w-[460px] opacity-45"
              animate={{ x: [0, -20, 12, 0], y: [0, 12, -8, 0] }}
              transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />

            {/* Soft grid */}
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-30" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-200/70 bg-primary-50/80 px-3.5 py-1.5 text-[12px] font-medium text-primary-700 shadow-soft-xs backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                Mulai gratis hari ini
              </div>

              <h2 className="mt-6 text-balance text-[34px] font-semibold leading-[1.04] tracking-tightest text-ink sm:text-5xl lg:text-[60px]">
                Jual & beli HP,
                <br />
                <span className="gradient-text-static">dibantoo-in.</span>
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base text-surface-600 sm:text-lg">
                Penjual dapat fee yang masuk akal. Pembeli dapat transaksi aman & teknisi terverifikasi.
                Daftar gratis — tanpa kartu kredit.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Magnetic strength={10}>
                  <Link href="/register">
                    <Button variant="primary" size="xl" className="group">
                      Daftar gratis
                      <ArrowRight className="h-5 w-5 transition-transform duration-450 group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </Magnetic>
                <Link href="/marketplace">
                  <Button variant="outline" size="xl">
                    Lihat marketplace
                  </Button>
                </Link>
              </div>

              {/* Trust */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-surface-500">
                {trustItems.map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-primary-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
