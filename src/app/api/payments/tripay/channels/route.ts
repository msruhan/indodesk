import { NextResponse } from 'next/server'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { getTripayConfig } from '@/lib/tripay/config'
import { tripayGetPaymentChannels } from '@/lib/tripay/client'

export const dynamic = 'force-dynamic'

/** GET /api/payments/tripay/channels — active Tripay payment channels */
export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  void session

  const cfg = getTripayConfig()
  if (!cfg.isConfigured) {
    return apiError('Payment gateway belum dikonfigurasi', 503)
  }

  try {
    const channels = await tripayGetPaymentChannels()
    const active = channels
      .filter((c) => c.active)
      .map((c) => ({
        code: c.code,
        name: c.name,
        group: c.group,
        type: c.type,
        iconUrl: c.icon_url,
      }))
    return apiSuccess(active)
  } catch (e) {
    console.error('[TRIPAY_CHANNELS]', e)
    const detail = e instanceof Error ? e.message : 'Gagal memuat channel pembayaran'
    const message =
      process.env.NODE_ENV === 'development' ? detail : 'Gagal memuat channel pembayaran'
    return apiError(message, 502)
  }
}
