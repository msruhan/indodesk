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
    return apiError('Payment gateway belum dikonfigurasi. Set TRIPAY_* di server.', 503)
  }
  if (cfg.modeMismatch) {
    return apiError(
      'Konfigurasi Tripay tidak cocok: API Key sandbox (DEV-) harus TRIPAY_MODE=sandbox.',
      503,
    )
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
    if (active.length === 0) {
      return apiError(
        'Tidak ada channel aktif. Aktifkan di Tripay → Sandbox → Channel Pembayaran.',
        502,
      )
    }
    return apiSuccess(active)
  } catch (e) {
    console.error('[TRIPAY_CHANNELS]', e)
    const detail = e instanceof Error ? e.message : 'Gagal memuat channel pembayaran'
    const message = tripayErrorMessage(detail)
    return apiError(message, 502)
  }
}

function tripayErrorMessage(detail: string): string {
  if (/invalid api key/i.test(detail)) {
    return 'API Key Tripay tidak valid. Salin ulang dari dashboard Sandbox → Merchant, lalu update TRIPAY_* di server.'
  }
  if (/unauthorized|forbidden/i.test(detail)) {
    return 'Autentikasi Tripay gagal. Periksa API Key, Private Key, dan Merchant Code.'
  }
  if (process.env.NODE_ENV === 'development') return detail
  return 'Gagal memuat channel pembayaran'
}
