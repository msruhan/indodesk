'use client'

import { motion } from 'framer-motion'
import type { ProductCategory } from '@prisma/client'
import { hasBenchmarkDisplayData, type ProductBenchmarkDisplay } from '@/lib/product-benchmark-display'
import { ProductBenchmarkPanel } from '@/components/marketplace/product-benchmark-panel'

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  category: ProductCategory
  benchmark: ProductBenchmarkDisplay
  className?: string
}

/** Standalone benchmark card — prefer ProductDetailSpecsCard for product detail page */
export function ProductBenchmarkSection({ category, benchmark, className }: Props) {
  if (!hasBenchmarkDisplayData(category, benchmark)) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease }}
      className={`overflow-hidden rounded-[1.75rem] border border-surface-200/70 bg-white shadow-soft-sm ${className ?? ''}`}
    >
      <div className="border-b border-surface-200/70 bg-surface-50/60 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-surface-500">
          Data Benchmark
        </p>
        <h2 className="mt-0.5 text-lg font-bold tracking-tight text-black sm:text-xl">
          Kondisi & hardware terverifikasi
        </h2>
      </div>
      <div className="p-5 sm:p-6">
        <ProductBenchmarkPanel category={category} benchmark={benchmark} />
      </div>
    </motion.section>
  )
}
