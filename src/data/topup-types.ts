/**
 * Top-up domain types — kept frontend-only for the demo.
 * Backed by `mock-topup.ts` for now; can be swapped for real APIs without
 * touching the UI layer.
 */

export type TopupCategorySlug =
  | 'mobile-game'
  | 'pc-game'
  | 'voucher'
  | 'pulsa'
  | 'paket-data'
  | 'streaming'

export interface TopupCategory {
  slug: TopupCategorySlug
  label: string
  icon: 'gamepad' | 'desktop' | 'voucher' | 'phone' | 'wifi' | 'play'
}

export interface TopupProduct {
  slug: string
  category: TopupCategorySlug
  name: string
  publisher: string
  /** Square logo / mark (used on cards + detail) */
  logo: string
  /** 16:9 cover banner */
  cover: string
  /** Optional accent gradient that bleeds into the card top */
  accent: string
  description: string
  rating: number
  ratingCount: number
  ordersToday: number
  isHot?: boolean
  /** Field labels — different games have different IDs (User ID + Server) */
  idLabel: string
  /** Some products require a server / zone id */
  serverLabel?: string
  /** Extra inline tip shown under the inputs */
  idHelp: string
}

export interface TopupDenomination {
  sku: string
  productSlug: string
  /** Group used on detail (e.g. "Diamonds", "Membership", "Voucher") */
  group: string
  /** Short label shown on tile (e.g. "86 Diamonds") */
  label: string
  /** Optional supplemental text (e.g. "10 + 76 bonus") */
  note?: string
  basePrice: number
  /** If present, indicates a discount price */
  salePrice?: number
  /** Sticky badge: "HEMAT", "POPULAR", etc. */
  badge?: string
  /** Optional flash-sale window */
  flashSale?: {
    /** Stock breakdown for the progress bar */
    sold: number
    quota: number
    /** ISO string in the future for countdown */
    endsAt: string
  }
}

export type PaymentMethodKind = 'saldo' | 'qris' | 'ewallet' | 'bank' | 'va'

export interface PaymentMethod {
  id: string
  kind: PaymentMethodKind
  label: string
  /** Sub-label, e.g. "Saldo Anda: Rp 250.000" or "GoPay, OVO, DANA" */
  hint: string
  /** Fee in IDR; 0 if free */
  fee: number
  /** Auto-confirm payment (for saldo) */
  instant?: boolean
  /** Disabled if user's balance is too low etc. */
  disabled?: boolean
  disabledReason?: string
}

export interface TopupOrderDraft {
  productSlug: string
  denominationSku: string | null
  accountId: string
  serverId: string
  paymentMethodId: string | null
  promoCode: string
  email?: string
  whatsapp?: string
  /** Snapshot for /order/[id] page when the user submits. */
  submittedAt?: string
  /** Public order code (e.g. TT-7H3K9P-2026) */
  orderCode?: string
}

export type OrderStatus =
  | 'pending-payment'
  | 'paid'
  | 'processing'
  | 'fulfilling'
  | 'completed'
  | 'failed'

export interface OrderEvent {
  status: OrderStatus
  label: string
  description: string
  at: string
}
