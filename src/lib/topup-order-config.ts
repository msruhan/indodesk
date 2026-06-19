import type { PaymentMethod } from '@/data/topup-types'

/** Public order code: TT-XXXXXX-YYYY */
export function generateTopupOrderCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = (len: number) =>
    Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  return `TT-${part(6)}-${new Date().getFullYear()}`
}

export const TOPUP_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'saldo',
    kind: 'saldo',
    label: 'Saldo Bantoo',
    hint: 'Bayar instan dari saldo wallet',
    fee: 0,
    instant: true,
  },
  {
    id: 'tripay',
    kind: 'qris',
    label: 'QRIS / Virtual Account',
    hint: 'Bayar langsung via Tripay (tanpa saldo wallet)',
    fee: 0,
  },
]

/** Payment methods available for checkout (Tripay gated server-side). */
export function getTopupPaymentMethodsForClient(tripayEnabled: boolean): PaymentMethod[] {
  return TOPUP_PAYMENT_METHODS.filter((m) => m.id !== 'tripay' || tripayEnabled)
}

export const TOPUP_PROMO_CODES: Record<
  string,
  { type: 'percent' | 'fixed'; value: number; label: string }
> = {
  TEKNIZI10: { type: 'percent', value: 10, label: 'Diskon 10%' },
  HEMAT5K: { type: 'fixed', value: 5_000, label: 'Potongan Rp 5.000' },
  NEWUSER: { type: 'fixed', value: 10_000, label: 'New user — Rp 10.000' },
}

export function calcTopupDiscount(
  subtotal: number,
  promoCode: string | undefined | null,
): { discount: number; promoLabel: string | null } {
  if (!promoCode?.trim()) return { discount: 0, promoLabel: null }
  const promo = TOPUP_PROMO_CODES[promoCode.trim().toUpperCase()]
  if (!promo) return { discount: 0, promoLabel: null }
  const discount =
    promo.type === 'percent'
      ? Math.round((subtotal * promo.value) / 100)
      : Math.min(promo.value, subtotal)
  return { discount, promoLabel: promo.label }
}
