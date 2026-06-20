import { floorIdr } from '@/lib/marketplace-fees'
import type { PlatformSettingsDto } from '@/lib/platform-settings-shared'

export type ServiceFeeBreakdown = {
  price: number
  platformFee: number
  teknisiEarning: number
}

/** Fee platform layanan (konsultasi & inspeksi): dipotong dari harga, sisanya ke teknisi. */
export function calculateServicePlatformFees(
  price: number,
  feePercent: number,
): ServiceFeeBreakdown {
  const platformFee = floorIdr((price * feePercent) / 100)
  const teknisiEarning = Math.max(0, price - platformFee)
  return { price, platformFee, teknisiEarning }
}

export function previewServiceFees(
  price: number,
  settings: Pick<PlatformSettingsDto, 'konsultasiFeePercent' | 'inspeksiFeePercent'>,
) {
  return {
    konsultasi: calculateServicePlatformFees(price, settings.konsultasiFeePercent),
    inspeksi: calculateServicePlatformFees(price, settings.inspeksiFeePercent),
  }
}
