'use client'

import { motion } from 'framer-motion'
import type { ProductCategory, ProductWarranty } from '@prisma/client'
import { Card, CardContent } from '@/components/ui/card'
import { ProductPublicSpecs } from '@/components/marketplace/product-public-specs'
import { ProductBenchmarkPanel } from '@/components/marketplace/product-benchmark-panel'
import { Product3uToolsGallery } from '@/components/marketplace/product-3utools-gallery'
import {
  categoryRequiresSpecs,
  getProductSpecDisplayRows,
  type ProductCompletenessKey,
} from '@/lib/product-specs'
import {
  hasBenchmarkDisplayData,
  type ProductBenchmarkDisplay,
} from '@/lib/product-benchmark-display'
import type { ProductImageEntry } from '@/lib/product-images'

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  category: ProductCategory
  color: string
  ram: string
  processor: string
  storage: string
  warranty: ProductWarranty
  completeness: ProductCompletenessKey[]
  benchmark: ProductBenchmarkDisplay
  threeUtoolsImages: ProductImageEntry[]
}

function hasSpecsContent(
  category: ProductCategory,
  props: Pick<Props, 'color' | 'ram' | 'processor' | 'storage' | 'warranty' | 'completeness'>,
): boolean {
  if (!categoryRequiresSpecs(category)) return false
  const rows = getProductSpecDisplayRows(category, {
    color: props.color,
    ram: props.ram,
    processor: props.processor,
    storage: props.storage,
    warranty: props.warranty,
    completeness: props.completeness,
  })
  return rows.length > 0 || props.completeness.length > 0
}

export function shouldShowProductDetailCard(props: Props): boolean {
  return (
    hasSpecsContent(props.category, props) ||
    hasBenchmarkDisplayData(props.category, props.benchmark) ||
    props.threeUtoolsImages.some((img) => img.url)
  )
}

export function ProductDetailSpecsCard({
  category,
  color,
  ram,
  processor,
  storage,
  warranty,
  completeness,
  benchmark,
  threeUtoolsImages,
}: Props) {
  if (
    !shouldShowProductDetailCard({
      category,
      color,
      ram,
      processor,
      storage,
      warranty,
      completeness,
      benchmark,
      threeUtoolsImages,
    })
  ) {
    return null
  }

  const showSpecs = hasSpecsContent(category, {
    color,
    ram,
    processor,
    storage,
    warranty,
    completeness,
  })
  const showBenchmark = hasBenchmarkDisplayData(category, benchmark)
  const has3uTools = threeUtoolsImages.some((img) => img.url)
  const showCondition = showBenchmark || has3uTools

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease }}
    >
      <Card className="overflow-hidden rounded-[1.75rem] border-surface-200/70 shadow-soft-sm">
        <CardContent className="p-0">
          <div className="border-b border-surface-200/70 bg-surface-50/60 px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surface-500">
              Detail produk
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">
              Spesifikasi & Kondisi Perangkat
            </h2>
          </div>

          <div className="space-y-0">
            {showSpecs && (
              <div className="px-5 py-5 sm:px-6">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-surface-500">
                  Spesifikasi Perangkat
                </p>
                <ProductPublicSpecs
                  category={category}
                  color={color}
                  ram={ram}
                  processor={processor}
                  storage={storage}
                  warranty={warranty}
                  completeness={completeness}
                />
              </div>
            )}

            {showSpecs && showCondition && (
              <div className="mx-5 border-t border-surface-200/70 sm:mx-6" aria-hidden />
            )}

            {showCondition && (
              <div className="bg-surface-50/40 px-5 py-5 sm:px-6">
                {showBenchmark && (
                  <ProductBenchmarkPanel category={category} benchmark={benchmark} />
                )}

                {showBenchmark && has3uTools && (
                  <div className="mt-5 border-t border-surface-200/70 pt-5" />
                )}

                {!showBenchmark && has3uTools && (
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-surface-500">
                    Kondisi & hardware
                  </p>
                )}

                {has3uTools && (
                  <Product3uToolsGallery
                    images={threeUtoolsImages}
                    variant="embedded"
                    className={showBenchmark ? undefined : 'mt-0'}
                  />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
