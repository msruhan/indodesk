'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { effectivePrice, formatIDR } from '@/lib/topup-utils'
import { findDenomination, paymentMethods, promoCodes } from '@/data/mock-topup'
import type { TopupOrderDraft, TopupProduct } from '@/data/topup-types'
import { ChevronDown, ShoppingCart, X } from '@/lib/icons'
import { OrderSummary } from './order-summary'
import { cn } from '@/lib/utils'

interface MobileCheckoutBarProps {
  product: TopupProduct
  draft: TopupOrderDraft
  ready: boolean
  onSubmit: () => void
}

export function MobileCheckoutBar({ product, draft, ready, onSubmit }: MobileCheckoutBarProps) {
  const [open, setOpen] = useState(false)

  const denom = draft.denominationSku ? findDenomination(draft.denominationSku) : null
  const method = draft.paymentMethodId
    ? paymentMethods.find((m) => m.id === draft.paymentMethodId) ?? null
    : null

  const subtotal = denom ? effectivePrice(denom) : 0
  const promo = draft.promoCode ? promoCodes[draft.promoCode.toUpperCase()] : null
  const discount = promo
    ? promo.type === 'percent'
      ? Math.round((subtotal * promo.value) / 100)
      : Math.min(promo.value, subtotal)
    : 0
  const fee = method?.fee ?? 0
  const total = Math.max(0, subtotal - discount + fee)

  return (
    <>
      {/* Bottom bar (always visible on mobile) */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 lg:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
      >
        <div className="mx-auto max-w-md px-3 pt-2">
          <div className="flex items-center gap-2 rounded-2xl border border-surface-200/70 bg-white/95 px-3 py-2 shadow-soft-lg backdrop-blur-md">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-2"
              aria-label="Lihat ringkasan order"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                <ShoppingCart className="h-4 w-4" />
              </span>
              <div className="min-w-0 text-left">
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-surface-500">
                  {denom ? denom.label : 'Pilih nominal'}
                </p>
                <p className="text-sm font-bold tracking-tight-lg text-primary-700 tabular-nums">
                  {formatIDR(total)}
                </p>
              </div>
            </button>
            <Button variant="primary" size="default" className="px-5" disabled={!ready} onClick={onSubmit}>
              Pesan
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end lg:hidden"
            initial="closed"
            animate="open"
            exit="closed"
            variants={{ closed: {}, open: {} }}
          >
            {/* Scrim */}
            <motion.div
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              variants={{ closed: { opacity: 0 }, open: { opacity: 1 } }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              role="dialog"
              aria-modal="true"
              variants={{
                closed: { y: '100%' },
                open: { y: 0 },
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 600) setOpen(false)
              }}
              className={cn(
                'relative z-10 w-full rounded-t-3xl bg-surface-50 shadow-soft-2xl',
                'max-h-[88vh] overflow-y-auto',
              )}
            >
              {/* Drag handle */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-200/60 bg-white/85 px-3 pt-2 pb-3 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-500 hover:bg-surface-100 hover:text-ink"
                  aria-label="Tutup"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="h-1 w-10 rounded-full bg-surface-300" />
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-500">
                    Ringkasan order
                  </p>
                </div>
                <div className="w-8" />
              </div>

              <div
                className="px-3 pb-5"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
              >
                <OrderSummary
                  product={product}
                  draft={draft}
                  ready={ready}
                  onSubmit={() => {
                    setOpen(false)
                    onSubmit()
                  }}
                />
              </div>

              <span aria-hidden className="pointer-events-none absolute right-4 top-2 text-surface-400">
                <ChevronDown className="h-4 w-4" />
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
