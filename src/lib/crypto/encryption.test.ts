import { beforeEach, describe, expect, it } from 'vitest'
import { decryptString, encryptString, isEncryptedValue } from '@/lib/crypto/encryption'

describe('envelope encryption', () => {
  beforeEach(() => {
    process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64')
  })

  it('round-trips plaintext losslessly', () => {
    const plain = 'sk_live_test_api_key_12345'
    const ct = encryptString(plain)
    expect(isEncryptedValue(ct)).toBe(true)
    expect(decryptString(ct)).toBe(plain)
  })

  it('rejects tampered ciphertext', () => {
    const ct = encryptString('secret')
    const parts = ct.split(':')
    parts[parts.length - 1] = parts[parts.length - 1].slice(0, -2) + 'XX'
    const tampered = parts.join(':')
    expect(() => decryptString(tampered)).toThrow()
  })

  it('passes through legacy plaintext', () => {
    expect(decryptString('not-encrypted-yet')).toBe('not-encrypted-yet')
  })

  it('assertCryptoConfigured accepts 32-byte base64 KEK', async () => {
    const { assertCryptoConfigured } = await import('@/lib/crypto/encryption')
    expect(() => assertCryptoConfigured()).not.toThrow()
  })
})
