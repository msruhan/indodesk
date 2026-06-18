import { NextResponse } from 'next/server'
import { runWalletReconciliation } from '@/lib/wallet/reconciliation'
import { runWalletSecurityScan } from '@/lib/wallet/security-scan'
import { validateCronSecret } from '@/lib/cron-auth'
import { logCronAuthFailed } from '@/lib/security/request-blocks'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authError = validateCronSecret(req)
  if (authError) {
    logCronAuthFailed(req, '/api/cron/wallet-security-scan')
    return authError
  }

  const [reconciliation, security] = await Promise.all([
    runWalletReconciliation(),
    runWalletSecurityScan(),
  ])

  return NextResponse.json({
    success: true,
    reconciliation,
    security,
  })
}
