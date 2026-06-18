import { describe, expect, it } from 'vitest'
import { validateTelegramWebhookSecret } from '@/lib/telegram/webhook-auth'

describe('Telegram webhook secret', () => {
  it('rejects wrong secret when configured', () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'expected-secret'
    process.env.NODE_ENV = 'test'
    const req = new Request('http://localhost/api/telegram/webhook', {
      method: 'POST',
      headers: { 'X-Telegram-Bot-Api-Secret-Token': 'wrong' },
    })
    const res = validateTelegramWebhookSecret(req)
    expect(res?.status).toBe(401)
  })

  it('allows matching secret', () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'expected-secret'
    const req = new Request('http://localhost/api/telegram/webhook', {
      method: 'POST',
      headers: { 'X-Telegram-Bot-Api-Secret-Token': 'expected-secret' },
    })
    expect(validateTelegramWebhookSecret(req)).toBeNull()
  })
})
