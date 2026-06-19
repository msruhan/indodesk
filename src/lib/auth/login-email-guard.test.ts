import { describe, expect, it } from 'vitest'
import { isLoginEmailVerified } from '@/lib/auth/login-email-guard'

describe('isLoginEmailVerified', () => {
  it('allows login when email is verified', () => {
    expect(
      isLoginEmailVerified({ emailVerified: new Date(), isActive: true }),
    ).toBe(true)
  })

  it('allows login when admin activated account without email verify', () => {
    expect(isLoginEmailVerified({ emailVerified: null, isActive: true })).toBe(true)
  })

  it('blocks login when neither verified nor admin-activated', () => {
    expect(isLoginEmailVerified({ emailVerified: null, isActive: false })).toBe(false)
  })

  it('blocks inactive unverified even if email was never set', () => {
    expect(isLoginEmailVerified({ emailVerified: null, isActive: false })).toBe(false)
  })
})
