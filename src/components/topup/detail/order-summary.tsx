'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CheckCircle, ShoppingCart, Wallet } from '@/lib/icons'
import { effectivePrice, formatIDR } from '@/lib/topup-utils'
import { useTopupCatalog } from '@/contexts/topup-catalog-context'
import { calcTopupDiscount, TOPUP_PAYMENT_METHODS } from '@/lib/topup-order-config'
import type { TopupOrderDraft, TopupProduct } from '@/data/topup-types'
import { cn } from '@/lib/utils'

interface OrderSummaryProps {
  product: TopupProduct
  draft: TopupOrderDraft
  onSubmit: () => void
  /** Truthy when basic info is filled (account + denom + payment method) */
  ready: boolean
  submitting?: boolean
  className?: string
}

export function OrderSummary({ product, draft, onSubmit, ready, submitting, className }: OrderSummaryProps) {
  const { findDenomination } = useTopupCatalog()
  const denom = draft.denominationSku ? findDenomination(draft.denominationSku) : null
  const method = draft.paymentMethodId
    ? TOPUP_PAYMENT_METHODS.find((m) => m.id === draft.paymentMethodId) ?? null
    : null

  const subtotal = denom ? effectivePrice(denom) : 0
  const { discount } = calcTopupDiscount(subtotal, draft.promoCode)
  const fee = method?.fee ?? 0
  const total = Math.max(0, subtotal - discount + fee)

  return (
    <aside
      className={cn(
        'rounded-2xl border border-surface-200/70 bg-white shadow-soft-sm',
        className,
      )}
    >
      <div className="border-b border-surface-100 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary-700">
          <ShoppingCart className="h-3.5 w-3.5" />
          Ringkasan order
        </p>
      </div>

      <div className="space-y-3 px-4 py-3 text-sm">
        {/* Product */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-surface-200 bg-white p-1.5">
            <img src={product.logo} alt={product.name} className="max-h-full max-w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
            <p className="truncate text-[11px] text-surface-500">{product.publisher}</p>
          </div>
        </div>

        {/* Account */}
        {draft.accountId && (
          <div className="space-y-1 rounded-lg bg-surface-50/60 px-2.5 py-2 text-[12px]">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-surface-500">{product.idLabel}</p>
            <p className="font-semibold text-ink tabular-nums break-all">
              {draft.accountId}
              {draft.serverId && (
                <span className="ml-1.5 text-surface-500">({draft.serverId})</span>
              )}
            </p>
          </div>
        )}

        {/* Denomination */}
        {denom ? (
          <motion.div
            key={denom.sku}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-primary-200/60 bg-primary-50/40 px-3 py-2"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary-700">Item dipilih</p>
            <p className="text-[13px] font-semibold text-ink">{denom.label}</p>
            {denom.note && <p className="text-[11px] text-surface-500">{denom.note}</p>}
          </motion.div>
        ) : (
          <div className="rounded-lg border border-dashed border-surface-200 px-3 py-3 text-center text-[12px] text-surface-500">
            Pilih nominal di langkah 2
          </div>
        )}

        {/* Payment method preview */}
        {method && (
          <div className="flex items-center gap-2 rounded-lg bg-surface-50/60 px-2.5 py-2">
            <Wallet className="h-3.5 w-3.5 text-primary-600" />
            <span className="text-[12px] text-surface-700">{method.label}</span>
            {method.instant && <CheckCircle weight="fill" className="ml-auto h-3.5 w-3.5 text-primary-600" />}
          </div>
        )}

        {/* Calculation */}
        <div className="space-y-1 border-t border-surface-100 pt-3 text-[12px]">
          <Row label="Subtotal" value={formatIDR(subtotal)} />
          {discount > 0 && (
            <Row label={`Promo · ${draft.promoCode.toUpperCase()}`} value={`- ${formatIDR(discount)}`} accent="primary" />
          )}
          {fee > 0 && <Row label="Biaya admin" value={`+ ${formatIDR(fee)}`} />}
          <div className="flex items-center justify-between border-t border-surface-100 pt-2">
            <span className="text-[12px] font-semibold text-ink">Total</span>
            <motion.span
              key={total}
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="text-base font-bold tracking-tight-lg text-primary-700 tabular-nums"
            >
              {formatIDR(total)}
            </motion.span>
          </div>
        </div>
      </div>

      <div className="border-t border-surface-100 p-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!ready || submitting}
          onClick={onSubmit}
        >
          {submitting ? 'Memproses…' : ready ? 'Pesan sekarang' : 'Lengkapi data dulu'}
        </Button>
        <p className="mt-2 text-center text-[10px] text-surface-500">
          Dengan menekan tombol ini Anda menyetujui{' '}
          <a className="text-primary-700 underline-offset-4 hover:underline">syarat layanan</a>.
        </p>
      </div>
    </aside>
  )
}

function Row({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'primary'
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-surface-500">{label}</span>
      <span
        className={cn(
          'font-medium tabular-nums',
          accent === 'primary' ? 'text-primary-700' : 'text-ink',
        )}
      >
        {value}
      </span>
    </div>
  )
}
