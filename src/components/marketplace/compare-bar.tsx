'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useCompare } from '@/contexts/compare-context'
import type { CompareItem } from '@/contexts/compare-context'
import { ArrowRight, Scales, X } from '@/lib/icons'
import { cn } from '@/lib/utils'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const SLOT_WIDTH = 'w-[11.5rem] sm:w-[12.5rem]'

function CompareSlotCard({
  item,
  onRemove,
}: {
  item: CompareItem
  onRemove: () => void
}) {
  return (
    <div
      className={cn(
        'group relative flex flex-shrink-0 items-center gap-2 rounded-xl border border-surface-200 bg-surface-50 p-1.5',
        SLOT_WIDTH,
      )}
    >
      {item.image ? (
        <img
          src={item.image}
          alt=""
          className="h-9 w-9 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-surface-200 text-[10px] font-semibold text-surface-500">
          —
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-ink">{item.name}</p>
        <p className="mt-0.5 truncate text-[10px] font-medium text-primary-700">{formatPrice(item.price)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-surface-200 text-surface-600 transition hover:bg-rose-100 hover:text-rose-600"
        aria-label={`Hapus ${item.name} dari perbandingan`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

function CompareEmptySlot({ index }: { index: number }) {
  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-surface-300 bg-surface-50/50 p-1.5',
        SLOT_WIDTH,
      )}
    >
      <p className="px-2 py-2 text-center text-[11px] font-medium leading-snug text-surface-400">
        Pilih produk ke-{index + 1}
      </p>
    </div>
  )
}

/**
 * Floating bar di bawah layar — muncul saat ada produk dipilih untuk dibandingkan.
 */
export function CompareBar() {
  const { items, remove, clear } = useCompare()

  const visible = items.length > 0
  const canCompare = items.length === 2
  const href = canCompare
    ? `/marketplace/bandingkan?a=${items[0]!.id}&b=${items[1]!.id}`
    : '#'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[60] px-3 sm:px-4 lg:bottom-6"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-2xl lg:max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-surface-200/80 bg-white/95 shadow-soft-lg backdrop-blur-xl">
              <div className="flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3">
                <div className="hidden h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-soft-xs sm:grid">
                  <Scales className="h-5 w-5" weight="fill" />
                </div>

                <div className="relative min-w-0 flex-1">
                  <div
                    className="flex gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    aria-label="Produk dipilih untuk dibandingkan"
                  >
                    {[0, 1].map((i) => {
                      const item = items[i]
                      if (item) {
                        return (
                          <CompareSlotCard
                            key={item.id}
                            item={item}
                            onRemove={() => remove(item.id)}
                          />
                        )
                      }
                      return <CompareEmptySlot key={`empty-${i}`} index={i} />
                    })}
                  </div>
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-white/95 to-transparent sm:hidden"
                    aria-hidden
                  />
                </div>

                <div className="flex flex-shrink-0 items-center gap-1.5 border-l border-surface-100 pl-2 sm:pl-3">
                  {canCompare ? (
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 px-3 py-2.5 text-xs font-bold text-white shadow-glow-primary transition hover:shadow-glow-primary-lg"
                    >
                      Bandingkan
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex min-w-[2.75rem] items-center justify-center whitespace-nowrap rounded-xl bg-surface-100 px-3 py-2.5 text-xs font-semibold text-surface-500">
                      {items.length}/2
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={clear}
                    className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-surface-200 text-surface-500 transition hover:bg-surface-50 hover:text-rose-600"
                    aria-label="Bersihkan perbandingan"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
