import { Prisma } from '@prisma/client'
import type { PlatformSettingsDto } from '@/lib/platform-settings-shared'

export type MarketplaceFeeSettings = Pick<
  PlatformSettingsDto,
  'buyerFeePercent' | 'buyerFlatFeePerItem' | 'sellerFeePercent'
>

export type MarketplaceFeeBreakdown = {
  buyerFee: number
  buyerFeePercentPart: number
  buyerFlatFeePart: number
  sellerFee: number
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

export function computeMarketplaceFees(
  subtotal: number,
  settings: MarketplaceFeeSettings,
  itemCount = 1,
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
  const sellerFee =
    settings.sellerFeePercent > 0
      ? floorIdr((subtotal * settings.sellerFeePercent) / 100)
      : 0
  const buyerHold = subtotal + buyerFee
  const sellerNet = Math.max(0, subtotal - sellerFee)

  return {
    buyerFee,
    buyerFeePercentPart,
    buyerFlatFeePart,
    sellerFee,
    itemCount: qty,
    buyerHold,
    sellerNet,
    buyerFeeAmount: new Prisma.Decimal(buyerFee),
    sellerFeeAmount: new Prisma.Decimal(sellerFee),
    buyerHoldAmount: new Prisma.Decimal(buyerHold),
    sellerNetAmount: new Prisma.Decimal(sellerNet),
  }
}
