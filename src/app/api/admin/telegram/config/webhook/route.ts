import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import { getTelegramWebhookInfo, setTelegramWebhook } from '@/lib/telegram'
import { isTelegramEnabled } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

function appWebhookUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://bantoo.in'
  return `${base}/api/telegram/webhook`
}

/** POST /api/admin/telegram/config/webhook — daftar ulang webhook ke Telegram */
export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  if (!isTelegramEnabled()) {
    return apiError('Bot Telegram belum dikonfigurasi (TELEGRAM_BOT_TOKEN)', 400)
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
  if (!secret) {
    return apiError(
      'TELEGRAM_WEBHOOK_SECRET belum diset di server. Generate: openssl rand -hex 32',
      400,
    )
  }

  const webhookUrl = appWebhookUrl()
  const result = await setTelegramWebhook(webhookUrl, secret)
  if (!result.success) {
    return apiError(result.error ?? 'Gagal mendaftarkan webhook', 502)
  }

  const info = await getTelegramWebhookInfo()

  logAdminGovernance({
    req,
    actor: session.user,
    action: 'admin.telegram.webhook.register',
    summary: 'Webhook Telegram didaftarkan ulang',
    severity: 'WARNING',
    metadata: { webhookUrl },
  })

  return apiSuccess({
    webhookUrl,
    webhook: info.success ? info.data : null,
  })
}

/** GET — status webhook */
export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  if (!isTelegramEnabled()) {
    return apiSuccess({ configured: false, webhookUrl: appWebhookUrl(), webhook: null })
  }

  const info = await getTelegramWebhookInfo()
  return apiSuccess({
    configured: Boolean(info.success && info.data?.url),
    webhookUrl: appWebhookUrl(),
    webhook: info.success ? info.data : null,
    secretConfigured: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET?.trim()),
  })
}
