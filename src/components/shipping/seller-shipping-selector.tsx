'use client'

import { cn } from '@/lib/utils'
import type { SellerShippingQuote } from '@/lib/shipping-rates-server'
import { shippingOptionKey } from '@/lib/shipping-address'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

type SellerShippingSelectorProps = {
  quotes: SellerShippingQuote[]
  selections: Record<string, string>
  onSelect: (sellerId: string, optionKey: string) => void
  loading?: boolean
}

export function SellerShippingSelector({
  quotes,
  selections,
  onSelect,
  loading = false,
}: SellerShippingSelectorProps) {
  if (loading) {
    return (
      <p className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-[11px] text-surface-500">
        Menghitung ongkir…
      </p>
    )
  }

  if (quotes.length === 0) return null

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-ink">Estimasi ongkir per penjual</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-surface-500">
          Harga estimasi dari kurir. Tagihan final di konter bisa sedikit berbeda. Penjual wajib
          kirim sesuai kurir &amp; layanan yang Anda pilih.
        </p>
      </div>
      {quotes.map((quote) => (
        <div
          key={quote.sellerId}
          className="rounded-xl border border-surface-200 bg-surface-50/60 p-3"
        >
          {quote.error ? (
            <p className="text-[10px] text-rose-600">{quote.error}</p>
          ) : (
            <>
              {quote.options.length > 0 && quote.weightKg > 0 && (
                <p className="text-[10px] text-surface-500">Berat paket {quote.weightKg} kg</p>
              )}
              <div className={cn('space-y-1.5', quote.weightKg > 0 && 'mt-2')}>
                {quote.options.map((opt) => {
                  const key = shippingOptionKey(opt.courier, opt.service)
                  const selected = selections[quote.sellerId] === key
                  return (
                    <label
                      key={key}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-[11px]',
                        selected
                          ? 'border-primary-300 bg-primary-50/80'
                          : 'border-surface-200 bg-white hover:border-primary-200',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <input
                          type="radio"
                          name={`shipping-${quote.sellerId}`}
                          checked={selected}
                          onChange={() => onSelect(quote.sellerId, key)}
                          className="h-3.5 w-3.5 accent-primary-600"
                        />
                        <span className="truncate text-ink">
                          {opt.courierName} · {opt.service}
                          {opt.estimated ? (
                            <span className="text-surface-500"> ({opt.estimated})</span>
                          ) : null}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-ink">
                        {formatPrice(opt.price)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
