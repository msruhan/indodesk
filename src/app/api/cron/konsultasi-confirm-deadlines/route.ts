import { apiError, apiSuccess } from '@/lib/api-auth'
import { validateCronSecret } from '@/lib/cron-auth'
import { processKonsultasiConfirmDeadlines } from '@/lib/konsultasi-completion'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** VPS cron: every 15 min — curl -sf -H "Authorization: Bearer $CRON_SECRET" .../konsultasi-confirm-deadlines */

async function handle(req: Request) {
  const cronAuth = validateCronSecret(req)
  if (cronAuth) return cronAuth

  try {
    const stats = await processKonsultasiConfirmDeadlines()
    return apiSuccess({
      message: 'Konsultasi confirm deadlines processed',
      ...stats,
    })
  } catch (e) {
    console.error('[CRON_KONSULTASI_CONFIRM_DEADLINES]', e)
    return apiError('Gagal memproses deadline konfirmasi konsultasi', 500)
  }
}

export async function GET(req: Request) {
  return handle(req)
}

export async function POST(req: Request) {
  return handle(req)
}
