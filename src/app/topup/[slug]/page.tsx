'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/landing'
import { BottomNav } from '@/components/mobile'
import { Button } from '@/components/ui/button'
import { TrustStrip } from '@/components/topup/shared/trust-strip'
import { StepIndicator } from '@/components/topup/detail/step-indicator'
import { AccountInputStep } from '@/components/topup/detail/account-input-step'
import { DenominationGrid } from '@/components/topup/detail/denomination-grid'
import { PaymentMethodList } from '@/components/topup/detail/payment-method-list'
import { PromoCodeField } from '@/components/topup/detail/promo-code-field'
import { OrderSummary } from '@/components/topup/detail/order-summary'
import { MobileCheckoutBar } from '@/components/topup/detail/mobile-checkout-bar'
import { useTopup } from '@/contexts/topup-context'
import {
  denominationsOf,
  findDenomination,
  findProduct,
  paymentMethods,
  promoCodes,
} from '@/data/mock-topup'
import {
  compactNumber,
  effectivePrice,
  formatIDR,
  generateOrderCode,
} from '@/lib/topup-utils'
import { ArrowRight, ChevronLeft, Star } from '@/lib/icons'

export default function TopupDetailPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { draft, setDraft, saveOrder } = useTopup()

  const product = findProduct(params.slug)
  const denominations = useMemo(
    () => (product ? denominationsOf(product.slug) : []),
    [product],
  )

  // Sync draft with current product, picking up ?d=sku for deep links from flash sale.
  useEffect(() => {
    if (!product) return
    setDraft((prev) => {
      const desired = searchParams.get('d')
      const sameProduct = prev.productSlug === product.slug
      return {
        ...prev,
        productSlug: product.slug,
        // reset only when navigating to a different product
        denominationSku: sameProduct ? prev.denominationSku ?? desired ?? null : desired ?? null,
        accountId: sameProduct ? prev.accountId : '',
        serverId: sameProduct ? prev.serverId : '',
        paymentMethodId: sameProduct ? prev.paymentMethodId : null,
        promoCode: sameProduct ? prev.promoCode : '',
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.slug])

  if (!product) return notFound()

  const accountFilled = draft.accountId.trim().length >= 3 && (!product.serverLabel || draft.serverId.trim().length > 0)
  const denomPicked = !!draft.denominationSku
  const paymentPicked = !!draft.paymentMethodId
  const ready = accountFilled && denomPicked && paymentPicked

  const completed = {
    1: accountFilled,
    2: denomPicked,
    3: paymentPicked,
  } as const

  const currentStep: 1 | 2 | 3 = !accountFilled ? 1 : !denomPicked ? 2 : 3

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

  const handleSubmit = () => {
    if (!ready || !denom) return
    const code = generateOrderCode()
    saveOrder({
      orderCode: code,
      productSlug: product.slug,
      productName: product.name,
      denominationLabel: denom.label,
      total,
      accountId: draft.serverId ? `${draft.accountId} (${draft.serverId})` : draft.accountId,
      status: method?.kind === 'saldo' ? 'paid' : 'pending-payment',
      createdAt: new Date().toISOString(),
    })
    setDraft((prev) => ({ ...prev, submittedAt: new Date().toISOString(), orderCode: code }))
    router.push(`/topup/order/${code}`)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      {/* Hero strip */}
      <section
        className="relative overflow-hidden border-b border-surface-200/60"
        aria-labelledby="topup-detail-title"
      >
        {/* Cover with mask */}
        <div className="absolute inset-0">
          <img
            src={product.cover}
            alt=""
            className="h-full w-full object-cover opacity-50"
            loading="eager"
          />
          <div className={`absolute inset-0 bg-gradient-to-br ${product.accent}`} />
          <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/70 to-white" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-5 sm:px-6 lg:px-8 lg:pb-7 lg:pt-28">
          {/* Breadcrumb */}
          <div className="mb-3 flex items-center gap-1 text-[11px] text-surface-500">
            <Link href="/topup" className="inline-flex items-center gap-1 hover:text-primary-700">
              <ChevronLeft className="h-3 w-3" />
              Top Up
            </Link>
            <span className="mx-1 text-surface-400">/</span>
            <span className="truncate text-ink">{product.name}</span>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-surface-200 bg-white p-2 shadow-soft-md sm:h-20 sm:w-20">
              <img
                src={product.logo}
                alt={`${product.name} logo`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-surface-500">
                {product.publisher}
              </p>
              <h1 id="topup-detail-title" className="mt-1 text-balance text-xl font-semibold tracking-tightest text-ink sm:text-2xl">
                {product.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-surface-600">
                <span className="inline-flex items-center gap-1">
                  <Star weight="fill" className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-semibold text-ink tabular-nums">{product.rating.toFixed(1)}</span>
                  <span className="truncate">({compactNumber(product.ratingCount)} ulasan)</span>
                </span>
                <span className="text-surface-400">·</span>
                <span>{compactNumber(product.ordersToday)} order hari ini</span>
              </div>
              <p className="mt-2 max-w-2xl text-[13px] leading-[1.7] text-surface-600">
                {product.description}
              </p>
            </div>
          </div>

          <TrustStrip className="mt-4 flex-wrap" />
        </div>
      </section>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 pb-32 pt-5 sm:px-6 lg:px-8 lg:pb-12">
        {/* Step indicator (sticky on mobile) */}
        <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-surface-200/60 bg-surface-50/85 px-4 py-2 backdrop-blur-md sm:-mx-0 sm:px-0 lg:hidden">
          <StepIndicator currentStep={currentStep} completed={completed} />
        </div>

        <div className="hidden lg:mb-5 lg:block">
          <StepIndicator currentStep={currentStep} completed={completed} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:gap-6">
          {/* Left — sequential steps */}
          <div className="min-w-0 space-y-5">
            {/* Step 1 */}
            <SectionCard
              step={1}
              title="Masukkan data akun"
              description="Pastikan ID benar — kami tidak bertanggung jawab atas salah input."
              completed={completed[1]}
            >
              <AccountInputStep
                product={product}
                accountId={draft.accountId}
                serverId={draft.serverId}
                onAccountIdChange={(v) => setDraft((p) => ({ ...p, accountId: v }))}
                onServerIdChange={(v) => setDraft((p) => ({ ...p, serverId: v }))}
              />
            </SectionCard>

            {/* Step 2 */}
            <SectionCard
              step={2}
              title="Pilih nominal"
              description="Tap salah satu paket di bawah ini."
              completed={completed[2]}
            >
              <DenominationGrid
                denominations={denominations}
                selectedSku={draft.denominationSku}
                onSelect={(sku) => setDraft((p) => ({ ...p, denominationSku: sku }))}
              />
            </SectionCard>

            {/* Step 3 */}
            <SectionCard
              step={3}
              title="Pilih metode pembayaran"
              description="Saldo IndoTeknizi auto-confirm dan dapat cashback 1%."
              completed={completed[3]}
            >
              <PaymentMethodList
                selectedId={draft.paymentMethodId}
                onSelect={(id) => setDraft((p) => ({ ...p, paymentMethodId: id }))}
              />

              <div className="mt-4 space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-surface-500">
                  Punya kode promo?
                </p>
                <PromoCodeField
                  value={draft.promoCode}
                  onChange={(code) => setDraft((p) => ({ ...p, promoCode: code }))}
                  subtotal={subtotal}
                />
              </div>
            </SectionCard>
          </div>

          {/* Right — sticky summary (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <OrderSummary product={product} draft={draft} ready={ready} onSubmit={handleSubmit} />
              <p className="mt-3 px-1 text-[11px] text-surface-500">
                Setelah pesan, kamu akan diarahkan ke halaman tracking dengan kode order. Simpan kode itu untuk cek status nanti.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile checkout */}
      <MobileCheckoutBar product={product} draft={draft} ready={ready} onSubmit={handleSubmit} />

      <BottomNav />
    </div>
  )
}

function SectionCard({
  step,
  title,
  description,
  completed,
  children,
}: {
  step: 1 | 2 | 3
  title: string
  description: string
  completed: boolean
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: step * 0.04 }}
      className="rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-xs sm:p-5"
    >
      <header className="mb-3 flex items-center gap-3">
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
            completed ? 'bg-primary-500 text-white' : 'bg-ink text-white'
          }`}
        >
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold tracking-tight text-ink sm:text-base">{title}</h2>
          <p className="text-[11px] text-surface-500">{description}</p>
        </div>
      </header>
      {children}
    </motion.section>
  )
}
