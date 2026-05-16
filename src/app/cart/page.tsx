'use client'

import { useLayoutEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
import {
  ArrowRight,
  CheckCircle,
  ChevronLeft,
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

interface CartItem {
  id: string
  type: 'physical' | 'software' | 'topup'
  name: string
  subtitle: string
  image: string
  price: number
  quantity: number
  seller: string
  badge?: string
}

const initialCartItems: CartItem[] = [
  {
    id: '1',
    type: 'physical',
    name: 'iPhone 13 Pro Max - Second',
    subtitle: '256GB · Kondisi 95% · Fullset',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=200&fit=crop',
    price: 8500000,
    quantity: 1,
    seller: 'TechSolution Store',
    badge: 'Handphone',
  },
  {
    id: '2',
    type: 'software',
    name: 'Unlock Tool Premium License',
    subtitle: 'Lifetime · All brand support',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=200&fit=crop',
    price: 500000,
    quantity: 1,
    seller: 'Unlock Master',
    badge: 'Software',
  },
  {
    id: '3',
    type: 'topup',
    name: 'Mobile Legends 518 Diamonds',
    subtitle: '467 + 51 bonus · Proses instan',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop',
    price: 132000,
    quantity: 1,
    seller: 'IndoTeknizi Top Up',
    badge: 'Top Up',
  },
]

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
  const [items, setItems] = useState(initialCartItems)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    )
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0
  const total = subtotal - discount

  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'TEKNIZI10') {
      setPromoApplied(true)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-4 sm:px-6 lg:px-8 lg:pb-12 lg:pt-28">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-surface-200/70 bg-white text-surface-600 transition-colors hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
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
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Card className="overflow-hidden transition-shadow hover:shadow-soft-md">
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

                  {/* Promo code */}
                  <div className="mb-4">
                    {promoApplied ? (
                      <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/60 px-3 py-2">
                        <CheckCircle className="h-4 w-4 text-primary-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-primary-700">TEKNIZI10 · Diskon 10%</p>
                          <p className="text-[10px] text-primary-600">Hemat {formatPrice(discount)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setPromoApplied(false); setPromoCode('') }}
                          className="rounded-full p-1 text-primary-600 hover:bg-primary-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Kode promo"
                          className="h-9 flex-1 text-xs uppercase"
                          onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                        />
                        <Button variant="outline" size="sm" className="h-9" onClick={applyPromo}>
                          Pakai
                        </Button>
                      </div>
                    )}
                    {!promoApplied && (
                      <p className="mt-1.5 text-[10px] text-surface-400">
                        Coba: <span className="font-mono text-surface-600">TEKNIZI10</span>
                      </p>
                    )}
                  </div>

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
                    <div className="flex justify-between">
                      <span className="text-surface-500">Biaya layanan</span>
                      <span className="font-medium text-primary-700">Gratis</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-surface-100 pt-2">
                      <span className="text-sm font-bold text-ink">Total</span>
                      <motion.span
                        key={total}
                        initial={{ scale: 0.95, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-lg font-bold tracking-tight text-primary-700 tabular-nums"
                      >
                        {formatPrice(total)}
                      </motion.span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button variant="primary" size="lg" className="mt-4 w-full">
                    Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Button>

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
                  {formatPrice(total)}
                </p>
              </div>
              <Button variant="primary" size="default" className="px-5">
                Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <CartMobileNav />
    </div>
  )
}
