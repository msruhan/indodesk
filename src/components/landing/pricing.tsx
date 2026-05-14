'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

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
]

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-50 to-white" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-4">
            Paket pricing yang
            <span className="text-primary-600"> transparan</span>
          </h2>
          <p className="text-lg text-surface-600">
            Mulai gratis dan upgrade sesuai kebutuhan. Tanpa biaya tersembunyi.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative rounded-2xl p-6 lg:p-8 transition-all duration-300',
                plan.popular
                  ? 'bg-black text-white scale-[1.02] shadow-2xl shadow-black/30'
                  : 'bg-white border border-surface-200 hover:border-surface-300 hover:shadow-xl'
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary-600 text-white border-0 shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className={cn(
                  'text-xl font-bold mb-2',
                  plan.popular ? 'text-white' : 'text-surface-900'
                )}>
                  {plan.name}
                </h3>
                <p className={cn(
                  'text-sm',
                  plan.popular ? 'text-surface-300' : 'text-surface-500'
                )}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className={cn(
                      'text-4xl font-bold',
                      plan.popular ? 'text-white' : 'text-surface-900'
                    )}>
                      Gratis
                    </span>
                  ) : (
                    <>
                      <span className={cn(
                        'text-4xl font-bold',
                        plan.popular ? 'text-white' : 'text-surface-900'
                      )}>
                        Rp {plan.price.toLocaleString('id-ID')}
                      </span>
                      <span className={cn(
                        'text-sm',
                        plan.popular ? 'text-surface-400' : 'text-surface-500'
                      )}>
                        /{plan.period}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className={cn(
                      'w-5 h-5 flex-shrink-0 mt-0.5',
                      plan.popular ? 'text-primary-400' : 'text-primary-600'
                    )} />
                    <span className={cn(
                      'text-sm',
                      plan.popular ? 'text-surface-300' : 'text-surface-600'
                    )}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.popular ? 'primary' : 'outline'}
                className={cn(
                  'w-full',
                  !plan.popular && 'border-black text-black hover:bg-black hover:text-white'
                )}
                size="lg"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Teaser */}
        <div className="mt-16 text-center">
          <p className="text-surface-600">
            Have questions?{' '}
            <a href="#" className="text-primary-600 font-medium hover:underline">
              Check our FAQ
            </a>
            {' '}or{' '}
            <a href="#" className="text-primary-600 font-medium hover:underline">
              contact us
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
