'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {
  Reveal,
  SpotlightCard,
  staggerContainer,
  viewportReveal,
} from '@/components/motion'
import {
  Check,
  ArrowRight,
  Zap,
  Star,
  Sparkles,
} from '@/lib/icons'
import type { LandingPricingSection, PricingPlanIcon } from '@/lib/pricing-plans'

const ICON_MAP = {
  sparkles: Sparkles,
  zap: Zap,
  star: Star,
} satisfies Record<PricingPlanIcon, typeof Sparkles>

type Props = {
  data: LandingPricingSection
}

export function Pricing({ data }: Props) {
  const { meta, plans } = data

  if (plans.length === 0) return null

  return (
    <section id="pricing" className="relative overflow-hidden py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface-50/40 to-white" />
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[480px] max-w-5xl mesh-bg-soft opacity-80" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-16 max-w-3xl text-center">
          <Badge variant="primary" className="mb-4">
            <Zap className="h-3 w-3" /> {meta.badge}
          </Badge>
          <h2 className="text-balance text-[34px] font-semibold leading-[1.05] tracking-tightest text-ink sm:text-5xl">
            {meta.title}
            <span className="gradient-text-static">{meta.titleHighlight}</span>
          </h2>
          <p className="mt-4 text-pretty text-base text-surface-600 sm:text-lg">
            {meta.subtitle}
          </p>
        </Reveal>

        <motion.div
          className="grid gap-6 md:grid-cols-3 lg:gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {plans.map((tier) => {
            const Icon = ICON_MAP[tier.icon] ?? Sparkles
            return (
              <motion.div
                key={tier.id}
                variants={viewportReveal}
                className={tier.highlight ? 'md:scale-105' : ''}
              >
                <SpotlightCard
                  tone={tier.highlight ? 'primary' : 'neutral'}
                  className="relative h-full overflow-hidden"
                >
                  {tier.badge && (
                    <div className="absolute -right-12 top-6 rotate-45 bg-gradient-to-r from-primary-500 to-primary-600 px-12 py-1 text-center text-xs font-semibold text-white shadow-lg">
                      {tier.badge}
                    </div>
                  )}

                  <div className="relative">
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary-200/60 bg-gradient-to-br from-white to-primary-50 text-primary-700 shadow-soft-xs">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold tracking-tight text-ink">
                          {tier.name}
                        </h3>
                        <p className="mt-1 text-sm text-surface-600">{tier.description}</p>
                      </div>
                    </div>

                    <div className="mb-6 border-t border-surface-200/60 pt-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold tracking-tightest text-ink">
                          {tier.price}
                        </span>
                        <span className="text-sm text-surface-600">{tier.priceSubtext}</span>
                      </div>
                    </div>

                    <Link href={tier.ctaHref} className="mb-6 block">
                      <Button
                        variant={tier.highlight ? 'primary' : 'outline'}
                        size="lg"
                        className="group w-full"
                      >
                        {tier.cta}
                        <ArrowRight className="h-4 w-4 transition-transform duration-450 group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>

                    <div className="space-y-3 border-t border-surface-200/60 pt-6">
                      {tier.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-start gap-3 text-sm text-surface-700"
                        >
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
