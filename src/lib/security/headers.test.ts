import { describe, expect, it } from 'vitest'
import { buildSecurityHeaders, generateCspNonce } from '@/lib/security/headers'

describe('security headers', () => {
  it('generates unique nonces', () => {
    const a = generateCspNonce()
    const b = generateCspNonce()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThan(8)
  })

  it('embeds nonce in CSP and adds admin COOP/COEP', () => {
    const nonce = 'abc123'
    const admin = buildSecurityHeaders('/admin/users', nonce)
    const csp =
      admin['Content-Security-Policy-Report-Only'] ?? admin['Content-Security-Policy']
    expect(csp).toContain(`'nonce-${nonce}'`)
    expect(admin['Cross-Origin-Opener-Policy']).toBe('same-origin')
    expect(admin['Cross-Origin-Embedder-Policy']).toBe('require-corp')

    const pub = buildSecurityHeaders('/marketplace', nonce)
    expect(pub['Cross-Origin-Opener-Policy']).toBeUndefined()
  })
})
