'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Reveal, viewportReveal, staggerContainer } from '@/components/motion'
import { ArrowRight, Sparkles } from '@/lib/icons'
import { useAuth } from '@/contexts/auth-context'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import {
  canAccessInspectionService,
  canAccessRemoteService,
  canAccessRekberService,
} from '@/lib/platform-settings-shared'
import { RemoteOnlineIllustration } from '@/components/illustrations/remote-online-illustration'
import { InspectionIllustration } from '@/components/illustrations/inspection-illustration'
import { CompareProductsIllustration } from '@/components/illustrations/compare-products-illustration'
import { RekberIllustration } from '@/components/illustrations/rekber-illustration'

const ALL_SERVICES = [
  {
    eyebrow: 'Remote Online',
    title: 'Teknisi bantu dari jauh',
    description:
      'Sesi remote real-time antara user dan teknisi. Diagnosa, panduan, hingga eksekusi — tanpa perlu keluar rumah.',
    href: '/remote',
    cta: 'Lihat layanan remote',
    accent: 'primary' as const,
    illustration: RemoteOnlineIllustration,
    requireRemote: true,
  },
  {
    eyebrow: 'Inspeksi',
    title: 'Cek kondisi sebelum beli',
    description:
      'Teknisi terverifikasi membantu inspeksi HP/laptop online via video call atau offline langsung ke lokasi. Aman dari penipuan.',
    href: '/inspeksi',
    cta: 'Coba layanan inspeksi',
    accent: 'teal' as const,
    illustration: InspectionIllustration,
    requireInspection: true,
  },
  {
    eyebrow: 'Bandingkan',
    title: 'Pilih unit terbaik dengan skor objektif',
    description:
      'Bandingkan dua iklan side-by-side — kondisi, spesifikasi, hardware, dan kelengkapan dinilai otomatis. Dapatkan skor total & rekomendasi pemenang.',
    href: '/marketplace',
    cta: 'Coba bandingkan produk',
    accent: 'primary' as const,
    illustration: CompareProductsIllustration,
  },
  {
    eyebrow: 'Rekber',
    title: 'Transaksi aman dengan rekber platform',
    description:
      'Dana ditahan di rekening bersama sampai barang atau jasa diterima. Teknisi dan user terlindungi dari penipuan.',
    href: '/rekber',
    cta: 'Pelajari rekber',
    accent: 'amber' as const,
    illustration: RekberIllustration,
    requireRekber: true,
  },
]

const ACCENT_CLASSES: Record<
  'primary' | 'teal' | 'amber',
  { badge: string; cta: string; halo: string }
> = {
  primary: {
    badge:
      'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200/70',
    cta: 'text-primary-700 hover:text-primary-800',
    halo: 'from-primary-300/30 via-transparent to-transparent',
  },
  teal: {
    badge: 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200/70',
    cta: 'text-teal-700 hover:text-teal-800',
    halo: 'from-teal-300/30 via-transparent to-transparent',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70',
    cta: 'text-amber-700 hover:text-amber-800',
    halo: 'from-amber-300/30 via-transparent to-transparent',
  },
}

export function ServicesShowcase() {
  const { user } = useAuth()
  const { flags } = useFeatureFlags()
  const role = (user?.role as 'ADMIN' | 'TEKNISI' | 'USER' | undefined) ?? null

  const services = useMemo(
    () =>
      ALL_SERVICES.filter((service) => {
        if ('requireRemote' in service && service.requireRemote) {
          return canAccessRemoteService(role, flags)
        }
        if ('requireInspection' in service && service.requireInspection) {
          return canAccessInspectionService(role, flags)
        }
        if ('requireRekber' in service && service.requireRekber) {
          return canAccessRekberService(role, flags)
        }
        return true
      }),
    [role, flags],
  )

  return (
    <section
      id="services-showcase"
      className="relative overflow-hidden py-24 lg:py-32"
    >
      {/* Section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface-50/50 to-white" />
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[420px] max-w-5xl mesh-bg-soft opacity-60" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal className="mx-auto mb-14 max-w-3xl text-center">
          <Badge variant="primary" className="mb-4">
            <Sparkles className="h-3 w-3" />
            Layanan inti
          </Badge>
          <h2 className="text-balance text-[34px] font-semibold leading-[1.05] tracking-tightest text-ink sm:text-5xl">
            Empat layanan,
            <span className="gradient-text-static"> satu ekosistem</span>
          </h2>
          <p className="mt-4 text-pretty text-base text-surface-600 sm:text-lg">
            Dari diagnosa jarak jauh, inspeksi sebelum beli, perbandingan produk objektif, hingga transaksi yang dijamin admin — semuanya berjalan mulus dalam satu platform.
          </p>
        </Reveal>

        {/* Service rows — alternating layout */}
        <motion.div
          className="space-y-16 lg:space-y-24"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {services.map((service, idx) => {
            const Illustration = service.illustration
            const accent = ACCENT_CLASSES[service.accent]
            const reverse = idx % 2 === 1

            return (
              <motion.div
                key={service.title}
                variants={viewportReveal}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${
                  reverse ? 'lg:[direction:rtl]' : ''
                }`}
              >
                {/* Illustration */}
                <div className={reverse ? 'lg:[direction:ltr]' : ''}>
                  <div className="relative">
                    {/* Halo behind illustration */}
                    <div
                      aria-hidden
                      className={`pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br ${accent.halo} blur-2xl`}
                    />
                    <div className="relative">
                      <Illustration />
                    </div>
                  </div>
                </div>

                {/* Copy */}
                <div className={reverse ? 'lg:[direction:ltr]' : ''}>
                  <span
                    className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${accent.badge}`}
                  >
                    {service.eyebrow}
                  </span>
                  <h3 className="text-balance text-[26px] font-semibold leading-[1.1] tracking-tightest text-ink sm:text-[34px]">
                    {service.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-pretty text-[15px] leading-relaxed text-surface-600 sm:text-base">
                    {service.description}
                  </p>

                  <Link
                    href={service.href}
                    className={`group mt-6 inline-flex items-center gap-1.5 text-sm font-bold tracking-tight transition-colors ${accent.cta}`}
                  >
                    {service.cta}
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border bg-white transition-all group-hover:translate-x-0.5 group-hover:shadow-soft-xs ${
                        service.accent === 'primary'
                          ? 'border-primary-200 group-hover:border-primary-700'
                          : service.accent === 'teal'
                            ? 'border-teal-200 group-hover:border-teal-700'
                            : 'border-amber-200 group-hover:border-amber-700'
                      }`}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
