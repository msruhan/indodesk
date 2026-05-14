'use client'

import { motion } from 'framer-motion'
import { TrendingUp } from '@/lib/icons'
import { ProductCard } from './product-card'
import { popularProducts } from '@/data/mock-topup'

export function PopularRail() {
  if (popularProducts.length === 0) return null

  return (
    <section className="relative">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-soft-xs">
            <TrendingUp className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-ink sm:text-base">Popular sekarang</h2>
            <p className="text-[10px] text-surface-500">Game paling banyak di-top up hari ini</p>
          </div>
        </div>
      </div>

      <div className="-mx-4 px-4 sm:-mx-0 sm:px-0">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible md:grid-cols-3 lg:grid-cols-4">
          {popularProducts.map((product, idx) => (
            <motion.div
              key={product.slug}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: idx * 0.04 }}
              className="w-[220px] flex-shrink-0 sm:w-auto"
            >
              <ProductCard product={product} size="compact" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
