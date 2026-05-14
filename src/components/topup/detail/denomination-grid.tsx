'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Zap } from '@/lib/icons'
import { CountdownTimer } from '@/components/topup/shared/countdown-timer'
import { StockProgressBar } from '@/components/topup/shared/stock-progress-bar'
import { effectivePrice, formatIDR, groupBy } from '@/lib/topup-utils'
import type { TopupDenomination } from '@/data/topup-types'
import { cn } from '@/lib/utils'

interface DenominationGridProps {
  denominations: TopupDenomination[]
  selectedSku: string | null
  onSelect: (sku: string) => void
}

export function DenominationGrid({
  denominations,
  selectedSku,
  onSelect,
}: DenominationGridProps) {
  const flashItems = denominations.filter((d) => d.flashSale)
  const regularItems = denominations.filter((d) => !d.flashSale)
  const grouped = groupBy(regularItems, (d) => d.group)

  return (
    <div className="space-y-5">
      {/* Flash sale row */}
      {flashItems.length > 0 && (
        <DenominationGroup
          title="Flash Sale"
          accent="amber"
          icon={<Zap weight="fill" className="h-3 w-3 text-amber-600" />}
          items={flashItems}
          selectedSku={selectedSku}
          onSelect={onSelect}
        />
      )}

      {/* Regular groups */}
      {Object.entries(grouped).map(([group, items]) => (
        <DenominationGroup
          key={group}
          title={group}
          items={items}
          selectedSku={selectedSku}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function DenominationGroup({
  title,
  accent,
  icon,
  items,
  selectedSku,
  onSelect,
}: {
  title: string
  accent?: 'amber'
  icon?: React.ReactNode
  items: TopupDenomination[]
  selectedSku: string | null
  onSelect: (sku: string) => void
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3
          className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em]',
            accent === 'amber' ? 'text-amber-700' : 'text-surface-600',
          )}
        >
          {icon}
          {title}
          {accent === 'amber' && (
            <span className="ml-1 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          )}
        </h3>
        <span className="text-[10px] text-surface-400">{items.length} pilihan</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((d) => (
          <DenominationTile
            key={d.sku}
            denomination={d}
            selected={selectedSku === d.sku}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

function DenominationTile({
  denomination: d,
  selected,
  onSelect,
}: {
  denomination: TopupDenomination
  selected: boolean
  onSelect: (sku: string) => void
}) {
  const price = effectivePrice(d)
  const hasDiscount = d.salePrice && d.salePrice < d.basePrice
  const isFlash = !!d.flashSale

  return (
    <button
      type="button"
      onClick={() => onSelect(d.sku)}
      aria-pressed={selected}
      className={cn(
        'group/tile relative flex h-full flex-col rounded-xl border p-2.5 text-left transition-all duration-300 ease-out-expo focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60',
        selected
          ? isFlash
            ? 'border-amber-400 bg-amber-50/70 shadow-soft-md'
            : 'border-primary-500 bg-primary-50/70 shadow-soft-md'
          : isFlash
          ? 'border-amber-200/70 bg-gradient-to-br from-amber-50/40 to-white hover:-translate-y-0.5 hover:border-amber-400'
          : 'border-surface-200/70 bg-white hover:-translate-y-0.5 hover:border-primary-300',
      )}
    >
      {/* Selected check */}
      <AnimatePresence>
        {selected && (
          <motion.span
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={cn(
              'absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-soft-md',
              isFlash ? 'bg-amber-500' : 'bg-primary-600',
            )}
          >
            <CheckCircle weight="fill" className="h-3.5 w-3.5" />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge */}
      {d.badge && !isFlash && (
        <span
          className={cn(
            'absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
            d.badge === 'POPULAR'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-emerald-100 text-emerald-700',
          )}
        >
          {d.badge}
        </span>
      )}

      <p className="text-[12px] font-semibold text-ink leading-snug pr-6">{d.label}</p>
      {d.note && <p className="mt-0.5 text-[10px] text-surface-500">{d.note}</p>}

      <div className="mt-auto pt-2">
        {hasDiscount && (
          <p className="text-[10px] text-surface-400 line-through tabular-nums">
            {formatIDR(d.basePrice)}
          </p>
        )}
        <p
          className={cn(
            'text-sm font-bold tracking-tight-lg tabular-nums',
            isFlash ? 'text-amber-700' : 'text-primary-700',
          )}
        >
          {formatIDR(price)}
        </p>

        {isFlash && d.flashSale && (
          <div className="mt-2 space-y-1.5">
            <StockProgressBar sold={d.flashSale.sold} quota={d.flashSale.quota} />
            <CountdownTimer compact endsAt={d.flashSale.endsAt} />
          </div>
        )}
      </div>
    </button>
  )
}
