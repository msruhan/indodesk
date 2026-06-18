import { describe, expect, it } from 'vitest'
import { validateOriginRefererParts } from '@/lib/security/csrf'

describe('CSRF Origin/Referer', () => {
  const origin = 'http://localhost:3000'

  it('allows GET without origin', () => {
    expect(
      validateOriginRefererParts('GET', '/api/wallet', null, null),
    ).toEqual({ ok: true })
  })

  it('blocks POST without matching origin', () => {
    expect(
      validateOriginRefererParts('POST', '/api/wallet/topup', 'https://evil.example', null),
    ).toEqual({ ok: false, code: 'CSRF_BLOCKED' })
  })

  it('allows POST with allowlisted origin', () => {
    expect(
      validateOriginRefererParts('POST', '/api/wallet/topup', origin, null),
    ).toEqual({ ok: true })
  })

  it('allows POST from any loopback port (including npm start on 3001)', () => {
    expect(
      validateOriginRefererParts('POST', '/api/imei/orders', 'http://localhost:3001', null),
    ).toEqual({ ok: true })
  })

  it('exempts telegram webhook', () => {
    expect(
      validateOriginRefererParts('POST', '/api/telegram/webhook', null, null),
    ).toEqual({ ok: true })
  })

  it('exempts cron paths', () => {
    expect(
      validateOriginRefererParts('POST', '/api/cron/imei-orders', null, null),
    ).toEqual({ ok: true })
  })
})
