'use client'

import { useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/landing'
import { useAuth } from '@/contexts/auth-context'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { DashboardBottomNav, DashboardMobileSpacer } from '@/components/mobile/dashboard-bottom-nav'
import {
  getTeknisiNavHomeModeForPath,
  shouldTeknisiDashboardFirstSlot,
  subscribeTeknisiNavHome,
  syncTeknisiNavHomeModeFromPath,
} from '@/lib/teknisi-nav-home'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useCart } from '@/contexts/cart-context'
import type { CartItem } from '@/lib/cart'
import { calcCartCouponDiscount } from '@/lib/product-coupon'
import { computeMarketplaceFees } from '@/lib/marketplace-fees'
import type { MarketplaceFeeSettings } from '@/lib/marketplace-fees'
import { TripayChannelPicker } from '@/components/payments/tripay-channel-picker'
import { BackButton } from '@/components/shared/back-button'
import { CheckoutShippingAddressPanel } from '@/components/shipping/checkout-shipping-address-panel'
import { SellerShippingSelector } from '@/components/shipping/seller-shipping-selector'
import type { SellerShippingQuote } from '@/lib/shipping-rates-server'
import {
  EMPTY_STRUCTURED_SHIPPING_ADDRESS,
  formatStructuredShippingAddress,
  parseShippingOptionKey,
  shippingOptionKey,
  validateStructuredShippingAddress,
  type StructuredShippingAddress,
} from '@/lib/shipping-address'
import {
  findOwnProductsInCart,
  isOwnMarketplaceProduct,
  OWN_PRODUCT_CHECKOUT_MESSAGE,
} from '@/lib/marketplace-own-product'
import {
  ArrowRight,
  CheckCircle,
  Laptop,
  Minus,
  Plus,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Trash2,
  Wallet,
  X,
  Zap,
} from '@/lib/icons'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

function CartMobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const isTeknisi = user?.role === 'TEKNISI'

  useLayoutEffect(() => {
    if (isTeknisi) syncTeknisiNavHomeModeFromPath(pathname)
  }, [isTeknisi, pathname])

  const teknisiNavMode = useSyncExternalStore(
    subscribeTeknisiNavHome,
    () => (isTeknisi ? getTeknisiNavHomeModeForPath(pathname) : 'workspace'),
    () => (isTeknisi ? getTeknisiNavHomeModeForPath(pathname) : 'workspace'),
  )

  const useDashboardNav =
    user?.role === 'ADMIN' ||
    (isTeknisi && shouldTeknisiDashboardFirstSlot(pathname, teknisiNavMode))

  if (useDashboardNav) {
    return (
      <>
        <DashboardMobileSpacer />
        <DashboardBottomNav />
      </>
    )
  }

  return (
    <>
      <MobileSafeAreaSpacer />
      <BottomNav />
    </>
  )
}

const typeIcon = {
  physical: Smartphone,
  software: Laptop,
  topup: Zap,
}

const typeBadgeColor = {
  physical: 'bg-primary-50 text-primary-700 ring-primary-200/70',
  software: 'bg-violet-50 text-violet-700 ring-violet-200/70',
  topup: 'bg-amber-50 text-amber-700 ring-amber-200/70',
}

export default function CartPage() {
  const router = useRouter()
  const { status: sessionStatus, data: session } = useSession()
  const { items, updateQuantity, removeItem, hydrated, syncProducts } = useCart()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutSuccess, setCheckoutSuccess] = useState<string[] | null>(null)
  const [pgCheckout, setPgCheckout] = useState<{
    checkoutBatchId: string
    grandHoldTotal: number
  } | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromoCode, setAppliedPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [shippingAddress, setShippingAddress] = useState<StructuredShippingAddress>(
    EMPTY_STRUCTURED_SHIPPING_ADDRESS,
  )
  const [addressError, setAddressError] = useState<string | null>(null)
  const [shippingQuotes, setShippingQuotes] = useState<SellerShippingQuote[]>([])
  const [shippingSelections, setShippingSelections] = useState<Record<string, string>>({})
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingFetchError, setShippingFetchError] = useState<string | null>(null)
  const [buyerFeeSettings, setBuyerFeeSettings] = useState<Pick<
    MarketplaceFeeSettings,
    'buyerFeePercent' | 'buyerFlatFeePerItem'
  >>({
    buyerFeePercent: 2,
    buyerFlatFeePerItem: 0,
  })

  const marketplaceItems = items.filter((i) => i.type !== 'topup')
  const marketplaceItemIds = marketplaceItems.map((i) => i.id).join(',')
  const hasTopupOnly = items.length > 0 && marketplaceItems.length === 0
  const requiresShipping =
    marketplaceItems.length > 0 &&
    !marketplaceItems.every((i) => i.type === 'software')
  const sellerIds = useMemo(
    () => [...new Set(marketplaceItems.map((i) => i.sellerId).filter(Boolean))] as string[],
    [marketplaceItems],
  )
  const shippingLinesKey = useMemo(
    () =>
      marketplaceItems
        .filter((i) => i.type !== 'software')
        .map((i) => `${i.id}:${i.quantity}`)
        .join('|'),
    [marketplaceItems],
  )
  useLayoutEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/platform/marketplace-fees')
        const json = await res.json()
        if (res.ok && json.success && json.data) {
          setBuyerFeeSettings({
            buyerFeePercent: Number(json.data.buyerFeePercent ?? 2),
            buyerFlatFeePerItem: Number(json.data.buyerFlatFeePerItem ?? 0),
          })
        }
      } catch {
        /* ignore */
      }
    })()
  }, [])

  useLayoutEffect(() => {
    if (!hydrated || marketplaceItems.length === 0) return
    void (async () => {
      try {
        const res = await fetch('/api/marketplace/cart-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productIds: [...new Set(marketplaceItems.map((i) => i.id))],
          }),
        })
        const json = await res.json()
        if (res.ok && json.success && Array.isArray(json.data?.products)) {
          syncProducts(json.data.products)
        }
      } catch {
        /* ignore */
      }
    })()
  }, [hydrated, marketplaceItemIds, syncProducts])

  useLayoutEffect(() => {
    if (!requiresShipping || !shippingAddress.locationId || sellerIds.length === 0) {
      setShippingQuotes([])
      setShippingSelections({})
      return
    }

    void (async () => {
      setShippingLoading(true)
      setShippingFetchError(null)
      try {
        const res = await fetch('/api/shipping/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destinationLocationId: shippingAddress.locationId,
            sellerIds,
            lines: marketplaceItems
              .filter((i) => i.type !== 'software')
              .map((i) => ({ productId: i.id, quantity: i.quantity })),
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setShippingFetchError(json.error ?? 'Gagal menghitung ongkir')
          setShippingQuotes([])
          return
        }
        const quotes = (json.data?.bySeller ?? []) as SellerShippingQuote[]
        setShippingQuotes(quotes)
        setShippingSelections((prev) => {
          const next = { ...prev }
          for (const quote of quotes) {
            if (next[quote.sellerId]) continue
            const cheapest = quote.options[0]
            if (cheapest) {
              next[quote.sellerId] = shippingOptionKey(cheapest.courier, cheapest.service)
            }
          }
          return next
        })
      } catch {
        setShippingFetchError('Gagal menghitung ongkir')
        setShippingQuotes([])
      } finally {
        setShippingLoading(false)
      }
    })()
  }, [requiresShipping, shippingAddress.locationId, sellerIds.join(','), shippingLinesKey])

  const handleCheckout = async () => {
    if (marketplaceItems.length === 0) {
      setCheckoutError('Tidak ada produk marketplace di keranjang')
      return
    }

    if (sessionStatus !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent('/cart')}`)
      return
    }

    const ownProducts = findOwnProductsInCart(marketplaceItems, session?.user?.id)
    if (ownProducts.length > 0) {
      setCheckoutError(OWN_PRODUCT_CHECKOUT_MESSAGE)
      return
    }

    const validationError = requiresShipping
      ? validateStructuredShippingAddress(shippingAddress)
      : null
    if (validationError) {
      setAddressError(validationError)
      return
    }

    if (requiresShipping) {
      const missingSelection = sellerIds.some((id) => !shippingSelections[id])
      const hasQuoteError = shippingQuotes.some((q) => q.error)
      if (missingSelection || hasQuoteError || shippingLoading) {
        setAddressError('Pilih layanan pengiriman untuk semua penjual')
        return
      }
    }
    setAddressError(null)

    const formattedAddress = requiresShipping
      ? formatStructuredShippingAddress(shippingAddress)
      : ''

    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const shippingSelectionsPayload = sellerIds
        .map((sellerId) => {
          const key = shippingSelections[sellerId]
          const parsed = key ? parseShippingOptionKey(key) : null
          if (!parsed) return null
          return { sellerId, courier: parsed.courier, service: parsed.service }
        })
        .filter(Boolean)

      const res = await fetch('/api/marketplace/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: marketplaceItems.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
          })),
          requiresShipping,
          ...(requiresShipping
            ? {
                shippingAddress: formattedAddress,
                shippingPhone: shippingAddress.phone,
                shippingLocationId: shippingAddress.locationId,
                shippingProfile: {
                  cityId: shippingAddress.cityId,
                  cityLabel: shippingAddress.cityLabel,
                  districtId: shippingAddress.districtId,
                  districtLabel: shippingAddress.districtLabel,
                  locationId: shippingAddress.locationId,
                  locationLabel: shippingAddress.locationLabel,
                  street: shippingAddress.street,
                },
                shippingSelections: shippingSelectionsPayload,
              }
            : {}),
          ...(promoApplied && appliedPromoCode ? { couponCode: appliedPromoCode } : {}),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setCheckoutError(json.error ?? 'Checkout gagal')
        return
      }
      if (json.data?.needsPayment && json.data?.checkoutBatchId) {
        setPgCheckout({
          checkoutBatchId: json.data.checkoutBatchId as string,
          grandHoldTotal: Number(json.data.grandHoldTotal),
        })
        marketplaceItems.forEach((i) => removeItem(i.id))
        return
      }
      const codes: string[] = json.data?.orderCodes ?? []
      setCheckoutSuccess(codes)
      marketplaceItems.forEach((i) => removeItem(i.id))
    } catch {
      setCheckoutError('Checkout gagal')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (!hydrated) {
    return (
      <p className="py-16 text-center text-sm text-surface-500">Memuat keranjang...</p>
    )
  }

  const subtotal = marketplaceItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = promoApplied
    ? calcCartCouponDiscount(marketplaceItems, appliedPromoCode)
    : 0
  const total = subtotal - discount
  const itemCount = marketplaceItems.reduce((sum, item) => sum + item.quantity, 0)
  const buyerFeeBreakdown =
    marketplaceItems.length > 0
      ? computeMarketplaceFees(
          total,
          { ...buyerFeeSettings, sellerFeePercent: 0 },
          itemCount,
        )
      : null
  const buyerFee = buyerFeeBreakdown?.buyerFee ?? 0
  const shippingTotal = shippingQuotes.reduce((sum, quote) => {
    const key = shippingSelections[quote.sellerId]
    if (!key) return sum
    const opt = quote.options.find((o) => shippingOptionKey(o.courier, o.service) === key)
    return sum + (opt?.price ?? 0)
  }, 0)
  const checkoutTotal = total + buyerFee + shippingTotal
  const ownProductItems = findOwnProductsInCart(marketplaceItems, session?.user?.id)
  const hasOwnProducts = ownProductItems.length > 0
  const addressInvalid =
    requiresShipping &&
    (Boolean(validateStructuredShippingAddress(shippingAddress)) ||
      shippingLoading ||
      sellerIds.some((id) => !shippingSelections[id]) ||
      shippingQuotes.some((q) => q.error))
  const checkoutBlocked = hasOwnProducts || addressInvalid
  const checkoutLabel = 'Lanjut ke pembayaran'

  const applyPromo = async () => {
    const code = promoCode.trim()
    if (!code) {
      setPromoError('Masukkan kode kupon')
      return
    }
    if (marketplaceItems.length === 0) {
      setPromoError('Tidak ada produk di keranjang')
      return
    }

    setPromoLoading(true)
    setPromoError(null)
    try {
      const res = await fetch('/api/marketplace/coupon-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: code,
          items: marketplaceItems.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
          })),
        }),
      })
      const json = await res.json()
      const discount =
        res.ok && json.success ? Number(json.data?.discount ?? 0) : calcCartCouponDiscount(marketplaceItems, code)

      if (discount <= 0) {
        setPromoApplied(false)
        setAppliedPromoCode('')
        setPromoError('Kode kupon tidak cocok dengan produk di keranjang')
        return
      }
      setPromoError(null)
      setAppliedPromoCode(code.toUpperCase())
      setPromoApplied(true)
    } catch {
      const savings = calcCartCouponDiscount(marketplaceItems, code)
      if (savings <= 0) {
        setPromoApplied(false)
        setAppliedPromoCode('')
        setPromoError('Kode kupon tidak cocok dengan produk di keranjang')
        return
      }
      setPromoError(null)
      setAppliedPromoCode(code.toUpperCase())
      setPromoApplied(true)
    } finally {
      setPromoLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-4 sm:px-6 lg:px-8 lg:pb-12 lg:pt-28">
        {checkoutSuccess && (
          <Card className="mb-6 border-primary-200 bg-primary-50/50">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-primary-600" />
                <div>
                  <h2 className="font-semibold text-ink">Checkout berhasil!</h2>
                  <p className="mt-1 text-sm text-surface-600">
                    Pesanan berhasil dibuat. Selesaikan pembayaran untuk melanjutkan.
                  </p>
                  <p className="mt-2 font-mono text-xs text-surface-700">
                    {checkoutSuccess.join(' · ')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/user/orders">
                      <Button variant="primary" size="sm">
                        Lihat pesanan
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCheckoutSuccess(null)}
                    >
                      Tutup
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {hasTopupOnly && (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Item top-up tidak bisa checkout dari keranjang ini. Gunakan halaman Top Up.
          </p>
        )}

        {hasOwnProducts && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>{OWN_PRODUCT_CHECKOUT_MESSAGE}. Hapus produk milik Anda dari keranjang untuk melanjutkan checkout.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
              onClick={() => ownProductItems.forEach((item) => removeItem(item.id))}
            >
              Hapus produk sendiri ({ownProductItems.length})
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">
                Keranjang
              </h1>
              <p className="text-[12px] text-surface-500">
                {items.length} item · {items.filter((i) => i.type === 'physical').length} fisik, {items.filter((i) => i.type !== 'physical').length} digital
              </p>
            </div>
          </div>
          <Badge variant="primary" className="px-2.5 py-1">
            <ShoppingCart className="h-3 w-3" />
            {items.length}
          </Badge>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-16 text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
              <ShoppingCart className="h-7 w-7 text-surface-400" />
            </div>
            <h2 className="text-lg font-semibold text-ink">Keranjang kosong</h2>
            <p className="mt-1 text-sm text-surface-500">
              Belum ada produk di keranjang. Mulai belanja sekarang!
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/marketplace">
                <Button variant="primary" size="sm">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Marketplace
                </Button>
              </Link>
              <Link href="/topup">
                <Button variant="outline" size="sm">
                  <Zap className="h-3.5 w-3.5" />
                  Top Up Game
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            {/* Cart items */}
            <div className="space-y-2">
              <AnimatePresence>
                {items.map((item) => {
                  const TypeIcon = typeIcon[item.type]
                  const isOwnProduct = isOwnMarketplaceProduct(item.sellerId, session?.user?.id)
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Card className={cn(
                        'overflow-hidden transition-shadow hover:shadow-soft-md',
                        isOwnProduct && 'border-amber-200 bg-amber-50/30',
                      )}>
                        <CardContent className="flex gap-3 p-3 sm:p-4">
                          {/* Image */}
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-surface-100 sm:h-24 sm:w-24">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                            <span className={cn(
                              'absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold ring-1 ring-inset',
                              typeBadgeColor[item.type],
                            )}>
                              <TypeIcon className="h-2 w-2" />
                              {item.badge}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex min-w-0 flex-1 flex-col justify-between">
                            <div>
                              <h3 className="line-clamp-1 text-[13px] font-semibold text-ink sm:text-sm">
                                {item.name}
                              </h3>
                              <p className="mt-0.5 text-[11px] text-surface-500">{item.subtitle}</p>
                              <p className="mt-0.5 text-[10px] text-surface-400">
                                Seller: {item.seller}
                              </p>
                              {isOwnProduct && (
                                <p className="mt-1 text-[10px] font-medium text-amber-700">
                                  Produk milik Anda — tidak bisa dibeli sendiri
                                </p>
                              )}
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="text-[14px] font-bold text-primary-700 tabular-nums">
                                {formatPrice(item.price * item.quantity)}
                              </p>

                              {/* Quantity controls */}
                              <div className="flex items-center gap-1">
                                {item.type === 'physical' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.id, -1)}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-surface-200 text-surface-600 transition-colors hover:bg-surface-50 hover:text-ink"
                                      disabled={item.quantity <= 1}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-7 text-center text-[12px] font-semibold text-ink tabular-nums">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.id, 1)}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-surface-200 text-surface-600 transition-colors hover:bg-surface-50 hover:text-ink"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                  aria-label="Hapus item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Order summary — sticky on desktop */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="shadow-soft-md">
                <CardContent className="p-4 sm:p-5">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink">
                    <Wallet className="h-4 w-4 text-primary-600" />
                    Ringkasan Pesanan
                  </h2>

                  {requiresShipping && (
                    <div className="mb-4 space-y-3">
                      <p className="text-sm font-medium text-surface-700">Alamat pengiriman</p>
                      <CheckoutShippingAddressPanel
                        value={shippingAddress}
                        isAuthenticated={sessionStatus === 'authenticated'}
                        onChange={(next) => {
                          setShippingAddress(next)
                          if (addressError) setAddressError(null)
                        }}
                        onErrorClear={() => {
                          if (addressError) setAddressError(null)
                        }}
                      />
                      {shippingFetchError && (
                        <p className="text-[11px] text-rose-600">{shippingFetchError}</p>
                      )}
                      <SellerShippingSelector
                        quotes={shippingQuotes}
                        selections={shippingSelections}
                        loading={shippingLoading}
                        onSelect={(sellerId, optionKey) => {
                          setShippingSelections((prev) => ({ ...prev, [sellerId]: optionKey }))
                          if (addressError) setAddressError(null)
                        }}
                      />
                      {addressError && (
                        <p className="text-[11px] text-rose-600">{addressError}</p>
                      )}
                    </div>
                  )}

                  {/* Promo code */}
                  <div className="mb-4">
                    {promoApplied ? (
                      <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/60 px-3 py-2">
                        <CheckCircle className="h-4 w-4 text-primary-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-primary-700">
                            {appliedPromoCode} · Kupon produk diterapkan
                          </p>
                          <p className="text-[10px] text-primary-600">Hemat {formatPrice(discount)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPromoApplied(false)
                            setAppliedPromoCode('')
                            setPromoCode('')
                            setPromoError(null)
                          }}
                          className="rounded-full p-1 text-primary-600 hover:bg-primary-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-2">
                          <Input
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value.toUpperCase())
                              setPromoError(null)
                            }}
                            placeholder="Kode kupon produk"
                            className="h-9 flex-1 text-xs uppercase"
                            onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={() => void applyPromo()}
                            disabled={promoLoading}
                          >
                            {promoLoading ? '...' : 'Pakai'}
                          </Button>
                        </div>
                        {promoError && (
                          <p className="mt-1.5 text-[10px] text-rose-600">{promoError}</p>
                        )}
                      </div>
                    )}
                    <p className="mt-1.5 text-[10px] text-surface-400">
                      Masukkan kode kupon dari teknisi penjual (jika ada).
                    </p>
                  </div>

                  {checkoutError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {checkoutError}
                    </p>
                  )}

                  {/* Calculation */}
                  <div className="space-y-2 border-t border-surface-100 pt-3 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-surface-500">Subtotal ({items.length} item)</span>
                      <span className="font-medium text-ink tabular-nums">{formatPrice(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-primary-700">
                        <span>Diskon promo</span>
                        <span className="font-medium tabular-nums">- {formatPrice(discount)}</span>
                      </div>
                    )}
                    {buyerFeeBreakdown && buyerFeeBreakdown.buyerFeePercentPart > 0 && (
                      <div className="flex justify-between">
                        <span className="text-surface-500">Biaya Platform</span>
                        <span className="font-medium text-ink tabular-nums">
                          {formatPrice(buyerFeeBreakdown.buyerFeePercentPart)}
                        </span>
                      </div>
                    )}
                    {buyerFeeBreakdown && buyerFeeBreakdown.buyerFlatFeePart > 0 && (
                      <div className="flex justify-between">
                        <span className="text-surface-500">
                          Biaya layanan (
                          {formatPrice(buyerFeeSettings.buyerFlatFeePerItem)} × {itemCount} item)
                        </span>
                        <span className="font-medium text-ink tabular-nums">
                          {formatPrice(buyerFeeBreakdown.buyerFlatFeePart)}
                        </span>
                      </div>
                    )}
                    {buyerFeeBreakdown && buyerFee === 0 && (
                      <div className="flex justify-between">
                        <span className="text-surface-500">Biaya Platform</span>
                        <span className="font-medium text-ink tabular-nums">Gratis</span>
                      </div>
                    )}
                    {shippingTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-surface-500">Estimasi ongkir</span>
                        <span className="font-medium text-ink tabular-nums">
                          {formatPrice(shippingTotal)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-surface-100 pt-2">
                      <span className="text-sm font-bold text-ink">Total dibayar</span>
                      <motion.span
                        key={checkoutTotal}
                        initial={{ scale: 0.95, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-lg font-bold tracking-tight text-primary-700 tabular-nums"
                      >
                        {formatPrice(checkoutTotal)}
                      </motion.span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    variant="primary"
                    size="lg"
                    className="mt-4 w-full"
                    disabled={
                      checkoutLoading ||
                      marketplaceItems.length === 0 ||
                      checkoutBlocked
                    }
                    onClick={() => void handleCheckout()}
                  >
                    {checkoutLoading ? 'Memproses…' : checkoutLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="mt-2 text-center text-[11px] text-surface-500">
                    Bayar via QRIS atau Virtual Account — tanpa perlu top up saldo.
                  </p>

                  {/* Trust */}
                  <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-surface-500">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-primary-600" />
                      Pembayaran aman
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-primary-600" />
                      Garansi refund
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Mobile sticky checkout bar */}
      {items.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 lg:hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
        >
          <div className="mx-auto max-w-md px-3 pt-2">
            <div className="flex items-center gap-3 rounded-2xl border border-surface-200/70 bg-white/95 px-4 py-3 shadow-soft-lg backdrop-blur-md">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-surface-500">
                  Total ({items.length} item)
                </p>
                <p className="text-base font-bold tracking-tight text-primary-700 tabular-nums">
                  {formatPrice(checkoutTotal)}
                </p>
              </div>
              <Button
                variant="primary"
                size="default"
                className="px-5"
                disabled={
                  checkoutLoading ||
                  marketplaceItems.length === 0 ||
                  checkoutBlocked
                }
                onClick={() => void handleCheckout()}
              >
                {checkoutLoading ? '…' : 'Bayar'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {pgCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-ink">Bayar Pesanan</h3>
            <p className="mt-1 text-xs text-surface-500">
              Total hold {formatPrice(pgCheckout.grandHoldTotal)} (+ biaya channel Tripay)
            </p>
            <div className="mt-4">
              <TripayChannelPicker
                purpose="MARKETPLACE"
                targetId={pgCheckout.checkoutBatchId}
                submitLabel="Lanjutkan pembayaran"
                onCancel={() => setPgCheckout(null)}
                onSuccess={(merchantRef) => {
                  setPgCheckout(null)
                  router.push(`/payments/${merchantRef}`)
                }}
              />
            </div>
          </div>
        </div>
      )}

      <CartMobileNav />
    </div>
  )
}
