import { apiSuccess } from '@/lib/api-auth'
import { getTopupPaymentMethodsForClient } from '@/lib/topup-order-config'
import { getTripayConfig } from '@/lib/tripay/config'

export const dynamic = 'force-dynamic'

/** GET /api/topup/payment-methods */
export async function GET() {
  const tripayEnabled = getTripayConfig().isConfigured
  return apiSuccess(getTopupPaymentMethodsForClient(tripayEnabled))
}
