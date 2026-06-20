import { getPlatformSettings } from '@/lib/platform-settings'
import {
  calculateServicePlatformFees,
  type ServiceFeeBreakdown,
} from '@/lib/service-platform-fees'

export async function calculateKonsultasiFees(price: number): Promise<ServiceFeeBreakdown> {
  const settings = await getPlatformSettings()
  return calculateServicePlatformFees(price, settings.konsultasiFeePercent)
}

export async function calculateInspectionFeesFromSettings(
  price: number,
): Promise<ServiceFeeBreakdown> {
  const settings = await getPlatformSettings()
  return calculateServicePlatformFees(price, settings.inspeksiFeePercent)
}
