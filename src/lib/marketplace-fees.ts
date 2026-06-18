import { Prisma } from '@prisma/client'
import type { PlatformSettingsDto } from '@/lib/platform-settings-shared'

export type MarketplaceFeeBreakdown = {
  buyerFee: number
  sellerFee: number
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
  settings: Pick<PlatformSettingsDto, 'buyerFeePercent' | 'sellerFeePercent'>,
): MarketplaceFeeBreakdown {
  const buyerFee = floorIdr((subtotal * settings.buyerFeePercent) / 100)
  const sellerFee = floorIdr((subtotal * settings.sellerFeePercent) / 100)
  const buyerHold = subtotal + buyerFee
  const sellerNet = Math.max(0, subtotal - sellerFee)

  return {
    buyerFee,
    sellerFee,
    buyerHold,
    sellerNet,
    buyerFeeAmount: new Prisma.Decimal(buyerFee),
    sellerFeeAmount: new Prisma.Decimal(sellerFee),
    buyerHoldAmount: new Prisma.Decimal(buyerHold),
    sellerNetAmount: new Prisma.Decimal(sellerNet),
  }
}
