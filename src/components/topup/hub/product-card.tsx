'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SpotlightCard } from '@/components/motion'
import { Star, Zap } from '@/lib/icons'
import { compactNumber, formatIDR } from '@/lib/topup-utils'
import { useTopupCatalog } from '@/contexts/topup-catalog-context'
import type { TopupProduct } from '@/data/topup-types'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: TopupProduct
  /** Optional smaller variant (used in popular rail) */
  size?: 'default' | 'compact'
}

export function ProductCard({ product, size = 'default' }: ProductCardProps) {
  const { denominationsOf } = useTopupCatalog()
  const denoms = denominationsOf(product.slug)
  const startingPrice = denoms.length
    ? denoms.reduce(
        (min, d) => Math.min(min, d.salePrice ?? d.basePrice),
        Number.POSITIVE_INFINITY,
      )
    : 0

  const isCompact = size === 'compact'

  return (
    <Link
      href={`/topup/${product.slug}`}
      className="group/card block focus:outline-none focus-visible:rounded-3xl focus-visible:ring-2 focus-visible:ring-primary-400/60 focus-visible:ring-offset-2"
    >
      <SpotlightCard tone="primary" className="!p-0 overflow-hidden">
        {/* Cover */}
        <div className={cn('relative w-full overflow-hidden', isCompact ? 'aspect-[4/3]' : 'aspect-[16/10]')}>
          <img
            src={product.cover}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover/card:scale-105"
          />
          {/* Accent gradient overlay */}
          <div className={cn('absolute inset-0 bg-gradient-to-br', product.accent)} />
          {/* Bottom fade for legibility */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

          {/* HOT badge */}
          {product.isHot && (
            <motion.span
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-soft-md"
            >
              <Zap className="h-2.5 w-2.5" weight="fill" />
              Hot
            </motion.span>
          )}

          {/* Logo mark */}
          <div className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white/80 p-1.5 backdrop-blur-md">
            <img
              src={product.logo}
              alt={`${product.name} logo`}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          </div>

          {/* Name + publisher overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/75">
              {product.publisher}
            </p>
            <h3 className={cn('font-semibold tracking-tight text-white drop-shadow-sm', isCompact ? 'text-[15px]' : 'text-base')}>
              {product.name}
            </h3>
          </div>
        </div>

        {/* Footer info */}
        <div className={cn('flex items-center justify-between gap-2 px-3 py-2.5', isCompact && 'px-2.5 py-2')}>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-surface-500">
              <Star weight="fill" className="h-3 w-3 text-amber-400" />
              <span className="font-semibold text-ink tabular-nums">{product.rating.toFixed(1)}</span>
              <span className="truncate">· {compactNumber(product.ratingCount)} ulasan</span>
            </div>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-surface-400">
              Mulai dari
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-[0.14em] text-surface-400">{compactNumber(product.ordersToday)} hari ini</span>
            <p className="text-sm font-bold tracking-tight-lg text-primary-700 tabular-nums">
              {formatIDR(startingPrice)}
            </p>
          </div>
        </div>
      </SpotlightCard>
    </Link>
  )
}
