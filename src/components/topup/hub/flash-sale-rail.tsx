'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap } from '@/lib/icons'
import { CountdownTimer } from '@/components/topup/shared/countdown-timer'
import { StockProgressBar } from '@/components/topup/shared/stock-progress-bar'
import { compactNumber, formatIDR } from '@/lib/topup-utils'
import { useTopupCatalog } from '@/contexts/topup-catalog-context'

export function FlashSaleRail() {
  const { flashSaleDenominations, findProduct } = useTopupCatalog()
  if (flashSaleDenominations.length === 0) return null

  // Pick the soonest-ending flash sale to drive the section header timer.
  const earliest = [...flashSaleDenominations].sort(
    (a, b) =>
      new Date(a.flashSale!.endsAt).getTime() - new Date(b.flashSale!.endsAt).getTime(),
  )[0]

  return (
    <section className="relative">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-soft-xs">
            <Zap weight="fill" className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-ink sm:text-base">Flash Sale</h2>
            <p className="text-[10px] text-surface-500">Promo terbatas, jangan sampai terlewat</p>
          </div>
        </div>
        <CountdownTimer endsAt={earliest.flashSale!.endsAt} />
      </div>

      {/* Track */}
      <div className="-mx-4 px-4 sm:-mx-0 sm:px-0">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4">
          {flashSaleDenominations.map((d, idx) => {
            const product = findProduct(d.productSlug)
            if (!product) return null
            const price = d.salePrice ?? d.basePrice
            const discount = Math.round(((d.basePrice - price) / d.basePrice) * 100)

            return (
              <motion.div
                key={d.sku}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: idx * 0.04 }}
                className="w-[260px] flex-shrink-0 sm:w-auto"
              >
                <Link
                  href={`/topup/${product.slug}?d=${d.sku}`}
                  className="group/flash relative block h-full overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/60 via-white to-white p-3 shadow-soft-sm transition-all duration-450 ease-out-expo hover:-translate-y-1 hover:shadow-soft-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  {/* Decorative aurora */}
                  <div className="aurora-blob pointer-events-none absolute -right-12 -top-12 h-32 w-32 opacity-50">
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-amber-300 to-rose-300 blur-2xl" />
                  </div>

                  <div className="relative flex items-start gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-surface-200 bg-white p-1.5">
                      <img src={product.logo} alt={product.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-700">{product.name}</p>
                      <p className="truncate text-sm font-semibold text-ink">{d.label}</p>
                      {d.note && <p className="text-[11px] text-surface-500">{d.note}</p>}
                    </div>
                    {discount > 0 && (
                      <span className="flex-shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-soft-xs">
                        -{discount}%
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-surface-400 line-through tabular-nums">
                        {formatIDR(d.basePrice)}
                      </p>
                      <p className="text-base font-bold tracking-tight-lg text-amber-700 tabular-nums">
                        {formatIDR(price)}
                      </p>
                    </div>
                    <CountdownTimer compact endsAt={d.flashSale!.endsAt} />
                  </div>

                  <div className="mt-3">
                    <StockProgressBar sold={d.flashSale!.sold} quota={d.flashSale!.quota} />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
