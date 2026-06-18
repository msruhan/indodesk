import { runWalletReconciliation } from '@/lib/wallet/reconciliation'
import { runWalletSecurityScan } from '@/lib/wallet/security-scan'

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000

let timer: ReturnType<typeof setInterval> | null = null
let running = false

export function startWalletReconciliationScheduler() {
  if (process.env.WALLET_RECONCILIATION_SCHEDULER_ENABLED === 'false') return
  if (timer) return

  const interval = Number(process.env.WALLET_RECONCILIATION_INTERVAL_MS ?? DEFAULT_INTERVAL_MS)

  const tick = async () => {
    if (running) return
    running = true
    try {
      const [result, security] = await Promise.all([
        runWalletReconciliation(),
        runWalletSecurityScan(),
      ])
      if (result.drifts.length > 0) {
        console.warn('[wallet-reconciliation] drift detected:', result.drifts.length)
      }
      if (security.alertsCreated > 0) {
        console.warn('[wallet-security] new alerts:', security.alertsCreated)
      }
    } catch (e) {
      console.error('[wallet-reconciliation] failed', e)
    } finally {
      running = false
    }
  }

  void tick()
  timer = setInterval(() => void tick(), interval)
}
