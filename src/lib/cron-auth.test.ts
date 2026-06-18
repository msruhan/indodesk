import { describe, expect, it } from 'vitest'
import { extractBearerToken, getCronSecrets, validateCronSecret } from '@/lib/cron-auth'

describe('cron secret validation', () => {
  it('accepts CRON_SECRET bearer', () => {
    process.env.CRON_SECRET = 'current-secret'
    delete process.env.CRON_SECRET_OLD
    const req = new Request('http://localhost/api/cron/imei-orders', {
      headers: { Authorization: 'Bearer current-secret' },
    })
    expect(validateCronSecret(req)).toBeNull()
  })

  it('accepts CRON_SECRET_OLD during rotation', () => {
    process.env.CRON_SECRET = 'current-secret'
    process.env.CRON_SECRET_OLD = 'old-secret'
    const req = new Request('http://localhost/api/cron/imei-orders', {
      headers: { Authorization: 'Bearer old-secret' },
    })
    expect(validateCronSecret(req)).toBeNull()
  })

  it('rejects missing bearer', () => {
    process.env.CRON_SECRET = 'current-secret'
    const req = new Request('http://localhost/api/cron/imei-orders')
    const res = validateCronSecret(req)
    expect(res?.status).toBe(401)
  })

  it('parses bearer token', () => {
    const req = new Request('http://x', {
      headers: { Authorization: 'Bearer abc' },
    })
    expect(extractBearerToken(req)).toBe('abc')
    expect(getCronSecrets().length).toBeGreaterThanOrEqual(0)
  })
})
