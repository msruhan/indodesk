import { NextResponse } from 'next/server'

/**
 * Validate Telegram webhook secret header (R7.1).
 * In production, TELEGRAM_WEBHOOK_SECRET is required.
 */
export function validateTelegramWebhookSecret(req: Request): NextResponse | null {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
  const received = req.headers.get('x-telegram-bot-api-secret-token')?.trim()

  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured' },
        { status: 503 },
      )
    }
    return null
  }

  if (!received || received !== expected) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
