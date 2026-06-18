import { apiError, apiSuccess } from '@/lib/api-auth'
import { validateCronSecret } from '@/lib/cron-auth'
import { runWalletReconciliation } from '@/lib/wallet/reconciliation'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

async function handle(req: Request) {
  const cronAuth = validateCronSecret(req)
  if (cronAuth) return cronAuth

  try {
    const result = await runWalletReconciliation()
    return apiSuccess({
      message: 'Wallet reconciliation completed',
      ...result,
    })
  } catch (e) {
    console.error('[CRON_WALLET_RECONCILIATION]', e)
    return apiError('Gagal menjalankan rekonsiliasi wallet', 500)
  }
}

export async function GET(req: Request) {
  return handle(req)
}

export async function POST(req: Request) {
  return handle(req)
}
