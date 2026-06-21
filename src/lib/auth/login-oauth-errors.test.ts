import { describe, expect, it } from 'vitest'
import { loginOAuthErrorDetails } from '@/lib/auth/login-oauth-errors'

describe('loginOAuthErrorDetails', () => {
  it('returns register links for not_registered', () => {
    const details = loginOAuthErrorDetails('not_registered')
    expect(details?.title).toBe('Akun belum terdaftar')
    expect(details?.showRegisterLinks).toBe(true)
  })

  it('explains google_not_linked without register links', () => {
    const details = loginOAuthErrorDetails('google_not_linked')
    expect(details?.title).toBe('Google belum dihubungkan')
    expect(details?.showRegisterLinks).toBeUndefined()
  })

  it('falls back for unknown codes', () => {
    const details = loginOAuthErrorDetails('unknown_code')
    expect(details?.title).toBe('Login Google ditolak')
  })
})
