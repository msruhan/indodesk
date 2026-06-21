import { Prisma } from '@prisma/client'
import type { PlatformSettingsDto, SellerFeeTier } from '@/lib/platform-settings-shared'

export type MarketplaceFeeSettings = Pick<
  PlatformSettingsDto,
  'buyerFeePercent' | 'buyerFlatFeePerItem' | 'sellerFeePercent' | 'sellerFeeTiers'
>

export type MarketplaceFeeLineInput = {
  unitPrice: number
  quantity: number
}

export type MarketplaceFeeBreakdown = {
  buyerFee: number
  buyerFeePercentPart: number
  buyerFlatFeePart: number
  sellerFee: number
  /** Persentase tier item pertama (jika bervariasi antar item). */
  sellerFeePercentApplied: number
  itemCount: number
  buyerHold: number
  sellerNet: number
  buyerFeeAmount: Prisma.Decimal
  sellerFeeAmount: Prisma.Decimal
  buyerHoldAmount: Prisma.Decimal
  sellerNetAmount: Prisma.Decimal
}

/** Floor ke rupiah utuh — konsisten dengan pola Decimal existing. */
export function floorIdr(amount: number): number {
  return Math.max(0, Math.floor(amount))
}

export function formatSellerFeeTierRange(tier: SellerFeeTier): string {
  const min = tier.minAmount.toLocaleString('id-ID')
  if (tier.maxAmount == null) return `${min} – ∞`
  return `${min} – ${tier.maxAmount.toLocaleString('id-ID')}`
}

/** Harga contoh di tengah rentang tier — untuk preview admin. */
export function sampleItemPriceForTier(tier: SellerFeeTier): number {
  if (tier.maxAmount == null) {
    return Math.max(tier.minAmount, tier.minAmount + 100_000)
  }
  if (tier.maxAmount <= tier.minAmount) return tier.minAmount
  return Math.floor((tier.minAmount + tier.maxAmount) / 2)
}

export function normalizeSellerFeeTiers(tiers: SellerFeeTier[]): SellerFeeTier[] {
  return [...tiers]
    .map((tier) => ({
      minAmount: Math.max(0, Math.floor(tier.minAmount)),
      maxAmount:
        tier.maxAmount == null || tier.maxAmount === ('' as unknown as number)
          ? null
          : Math.max(0, Math.floor(tier.maxAmount)),
      feePercent: Math.min(100, Math.max(0, tier.feePercent)),
    }))
    .sort((a, b) => a.minAmount - b.minAmount)
}

export function validateSellerFeeTiers(tiers: SellerFeeTier[]): string | null {
  if (tiers.length === 0) return null
  if (tiers.length > 20) return 'Maksimal 20 tier fee penjual'

  const normalized = normalizeSellerFeeTiers(tiers)
  if (normalized[0]?.minAmount !== 0) {
    return 'Rentang pertama harus dimulai dari Rp 0'
  }

  for (const tier of normalized) {
    if (tier.maxAmount != null && tier.maxAmount < tier.minAmount) {
      return 'Harga maksimum tier tidak boleh lebih kecil dari minimum'
    }
  }

  const unlimited = normalized.filter((tier) => tier.maxAmount == null)
  if (unlimited.length > 1) {
    return 'Hanya tier terakhir yang boleh tanpa batas maksimum'
  }
  if (unlimited.length === 1 && normalized[normalized.length - 1]?.maxAmount != null) {
    return 'Tier tanpa batas maksimum harus berada di urutan terakhir'
  }

  return null
}

export function resolveSellerFeePercentForItemPrice(
  itemPrice: number,
  settings: Pick<PlatformSettingsDto, 'sellerFeePercent' | 'sellerFeeTiers'>,
): number {
  const tiers = normalizeSellerFeeTiers(settings.sellerFeeTiers ?? [])
  if (tiers.length === 0) return settings.sellerFeePercent

  let matched = settings.sellerFeePercent
  let matchedMin = -1
  for (const tier of tiers) {
    const inRange =
      itemPrice >= tier.minAmount &&
      (tier.maxAmount == null || itemPrice <= tier.maxAmount)
    if (inRange && tier.minAmount >= matchedMin) {
      matched = tier.feePercent
      matchedMin = tier.minAmount
    }
  }
  return matched
}

/** @deprecated Gunakan resolveSellerFeePercentForItemPrice */
export function resolveSellerFeePercent(
  subtotal: number,
  settings: Pick<PlatformSettingsDto, 'sellerFeePercent' | 'sellerFeeTiers'>,
): number {
  return resolveSellerFeePercentForItemPrice(subtotal, settings)
}

function buildFeeLines(
  subtotal: number,
  itemCount: number,
  lines?: MarketplaceFeeLineInput[],
): MarketplaceFeeLineInput[] {
  if (lines && lines.length > 0) {
    return lines.map((line) => ({
      unitPrice: Math.max(0, line.unitPrice),
      quantity: Math.max(0, Math.floor(line.quantity)),
    }))
  }

  const qty = Math.max(0, Math.floor(itemCount))
  if (qty === 0) return []
  const unitPrice = subtotal / qty
  return [{ unitPrice, quantity: qty }]
}

function computeSellerFeeFromLines(
  settings: Pick<PlatformSettingsDto, 'sellerFeePercent' | 'sellerFeeTiers'>,
  lines: MarketplaceFeeLineInput[],
): { sellerFee: number; sellerFeePercentApplied: number } {
  let sellerFee = 0
  let firstPercent = settings.sellerFeePercent

  for (const [index, line] of lines.entries()) {
    if (line.quantity <= 0) continue
    const percent = resolveSellerFeePercentForItemPrice(line.unitPrice, settings)
    if (index === 0) firstPercent = percent
    sellerFee += floorIdr((line.unitPrice * percent) / 100) * line.quantity
  }

  return { sellerFee, sellerFeePercentApplied: firstPercent }
}

export function computeMarketplaceFees(
  subtotal: number,
  settings: MarketplaceFeeSettings,
  itemCount = 1,
  lines?: MarketplaceFeeLineInput[],
): MarketplaceFeeBreakdown {
  const qty = Math.max(0, Math.floor(itemCount))
  const buyerFeePercentPart =
    settings.buyerFeePercent > 0
      ? floorIdr((subtotal * settings.buyerFeePercent) / 100)
      : 0
  const buyerFlatFeePart =
    settings.buyerFlatFeePerItem > 0 && qty > 0
      ? settings.buyerFlatFeePerItem * qty
      : 0
  const buyerFee = buyerFeePercentPart + buyerFlatFeePart

  const feeLines = buildFeeLines(subtotal, qty, lines)
  const { sellerFee, sellerFeePercentApplied } = computeSellerFeeFromLines(settings, feeLines)

  const buyerHold = subtotal + buyerFee
  const sellerNet = Math.max(0, subtotal - sellerFee)

  return {
    buyerFee,
    buyerFeePercentPart,
    buyerFlatFeePart,
    sellerFee,
    sellerFeePercentApplied,
    itemCount: qty,
    buyerHold,
    sellerNet,
    buyerFeeAmount: new Prisma.Decimal(buyerFee),
    sellerFeeAmount: new Prisma.Decimal(sellerFee),
    buyerHoldAmount: new Prisma.Decimal(buyerHold),
    sellerNetAmount: new Prisma.Decimal(sellerNet),
  }
}
