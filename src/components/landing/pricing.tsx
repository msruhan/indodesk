'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Sparkles } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Reveal, staggerContainer, viewportReveal } from '@/components/motion'

const plans = [
  {
    name: 'User',
    description: 'Gratis untuk membeli dan konsultasi',
    price: 0,
    period: 'selamanya',
    features: [
      'Akses marketplace penuh',
      'Konsultasi dengan teknisi',
      'Sistem rekber (escrow)',
      'Chat dengan teknisi/admin',
      'Lihat lowongan kerja',
      'Support email',
    ],
    cta: 'Daftar gratis',
    popular: false,
  },
  {
    name: 'Teknisi',
    description: 'Untuk teknisi yang ingin monetisasi skill',
    price: 50000,
    period: 'per bulan',
    features: [
      'Semua fitur User',
      'Pasang iklan produk/jasa',
      'Profil teknisi verified',
      'Dashboard statistik',
      'Sistem rating & review',
      'Chat real-time',
      'Manajemen order',
      'Top up saldo',
    ],
    cta: 'Mulai sekarang',
    popular: true,
  },
  {
    name: 'Toko',
    description: 'Paket lengkap untuk toko handphone',
    price: 150000,
    period: 'per bulan',
    features: [
      'Semua fitur Teknisi',
      'Promosi toko di platform',
      'Multiple produk listing',
      'Analytics dashboard',
      'Badge toko terpercaya',
      'Priority support',
      'Featured placement',
      'Laporan penjualan',
    ],
    cta: 'Hubungi sales',
    popular: false,
  },
] as const

export function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface-50/50 to-white" />
      <div className="aurora-blob aurora-blob-emerald pointer-events-none absolute left-1/2 top-32 h-[480px] w-[480px] -translate-x-1/2 opacity-25" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal className="mx-auto mb-14 max-w-3xl text-center">
          <Badge variant="primary" className="mb-4">
            Pricing
          </Badge>
          <h2 className="text-balance text-[34px] font-semibold leading-[1.05] tracking-tightest text-ink sm:text-5xl">
            Paket pricing yang
            <span className="gradient-text-static"> transparan</span>
          </h2>
          <p className="mt-4 text-pretty text-base text-surface-600 sm:text-lg">
            Mulai gratis dan upgrade sesuai kebutuhan. Tanpa biaya tersembunyi.
          </p>
        </Reveal>

        {/* Pricing grid */}
        <motion.div
          className="grid items-stretch gap-5 md:grid-cols-3 lg:gap-7"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={viewportReveal}
              className="relative h-full"
            >
              {/* Popular halo */}
              {plan.popular && (
                <div
                  aria-hidden
                  className="aurora-blob aurora-blob-emerald pointer-events-none absolute -inset-2 -z-10 opacity-50"
                />
              )}

              <div
                className={cn(
                  'relative flex h-full flex-col overflow-hidden rounded-3xl p-6 transition-all duration-450 ease-out-expo lg:p-8',
                  plan.popular
                    ? 'border-transparent bg-ink text-white shadow-soft-2xl lg:scale-[1.03]'
                    : 'border border-surface-200/70 bg-white/85 text-ink shadow-soft-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-soft-lg',
                )}
              >
                {plan.popular && (
                  <>
                    {/* Animated gradient ring */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-3xl p-px"
                      style={{
                        background:
                          'linear-gradient(140deg, rgba(16,185,129,0.6), rgba(6,182,212,0.55), rgba(16,185,129,0.2))',
                        WebkitMask:
                          'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                      }}
                    />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="gradient" className="border-0 shadow-soft-md">
                        <Sparkles className="h-3 w-3" />
                        Most popular
                      </Badge>
                    </div>
                  </>
                )}

                {/* Header */}
                <div className="mb-6">
                  <h3
                    className={cn(
                      'text-lg font-semibold tracking-tight-lg',
                      plan.popular ? 'text-white' : 'text-ink',
                    )}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={cn(
                      'mt-1 text-sm',
                      plan.popular ? 'text-surface-300' : 'text-surface-500',
                    )}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    {plan.price === 0 ? (
                      <span
                        className={cn(
                          'text-4xl font-semibold tracking-tightest tabular-nums',
                          plan.popular ? 'text-white' : 'text-ink',
                        )}
                      >
                        Gratis
                      </span>
                    ) : (
                      <>
                        <span
                          className={cn(
                            'text-4xl font-semibold tracking-tightest tabular-nums',
                            plan.popular ? 'text-white' : 'text-ink',
                          )}
                        >
                          Rp {plan.price.toLocaleString('id-ID')}
                        </span>
                        <span
                          className={cn(
                            'text-sm',
                            plan.popular ? 'text-surface-400' : 'text-surface-500',
                          )}
                        >
                          /{plan.period}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2
                        className={cn(
                          'mt-0.5 h-5 w-5 flex-shrink-0',
                          plan.popular ? 'text-primary-300' : 'text-primary-600',
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm',
                          plan.popular ? 'text-surface-200' : 'text-surface-600',
                        )}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-auto">
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="lg"
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 text-center text-sm text-surface-600">
          Punya pertanyaan?{' '}
          <a href="#" className="font-medium text-primary-700 hover:underline underline-offset-4">
            Cek FAQ
          </a>{' '}
          atau{' '}
          <a href="#" className="font-medium text-primary-700 hover:underline underline-offset-4">
            hubungi kami
          </a>
          .
        </div>
      </div>
    </section>
  )
}
