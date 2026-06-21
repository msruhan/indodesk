import {
  marketplaceOrderCancelActorLabel,
  shouldShowMarketplaceOrderCancelReason,
  type MarketplaceOrderCancelInfo,
} from '@/lib/marketplace-order-cancel-labels'

export { shouldShowMarketplaceOrderCancelReason }

export function MarketplaceOrderCancelReasonCard({
  order,
  compact = false,
}: {
  order: MarketplaceOrderCancelInfo
  compact?: boolean
}) {
  if (!shouldShowMarketplaceOrderCancelReason(order)) return null

  const actor = marketplaceOrderCancelActorLabel(order.cancelledBy)
  const title = actor ? `Alasan pembatalan (${actor})` : 'Alasan pembatalan'

  return (
    <section>
      <p
        className={
          compact
            ? 'mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-surface-500 sm:mb-2 sm:text-[10px] sm:tracking-[0.16em]'
            : 'mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-surface-500'
        }
      >
        {title}
      </p>
      <div
        className={
          compact
            ? 'rounded-xl border border-rose-200/80 bg-rose-50/70 px-2.5 py-2 text-xs leading-relaxed text-rose-900 sm:rounded-2xl sm:px-3 sm:py-2.5 sm:text-sm'
            : 'rounded-xl border border-rose-200/80 bg-rose-50/70 px-3 py-2.5 text-sm leading-relaxed text-rose-900'
        }
      >
        {order.cancelReason}
      </div>
    </section>
  )
}
