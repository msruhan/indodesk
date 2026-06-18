import { beforeEach, describe, expect, it } from 'vitest'
import { consumeTotpCode, TotpReplayError } from '@/lib/auth/totp-replay'

describe('TOTP replay guard', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('allows first use then rejects replay (in-memory)', async () => {
    const userId = 'user-test-1'
    const code = '123456'
    await consumeTotpCode(userId, code)
    await expect(consumeTotpCode(userId, code)).rejects.toThrow(TotpReplayError)
  })

  it('allows same code for different users', async () => {
    await consumeTotpCode('user-a', '654321')
    await expect(consumeTotpCode('user-b', '654321')).resolves.toBeUndefined()
  })
})
