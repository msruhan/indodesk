import { afterEach, describe, expect, it } from 'vitest'
import { assertProductionInvariants } from '@/lib/startup-assertions'

const envSnapshot = { ...process.env }

afterEach(() => {
  process.env = { ...envSnapshot }
})

describe('startup assertions', () => {
  it('throws when STRESS_TEST_MODE in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.STRESS_TEST_MODE = 'true'
    process.env.AUTH_SECRET = 'a'.repeat(32)
    process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64')
    expect(() => assertProductionInvariants()).toThrow(/STRESS_TEST_MODE/)
  })

  it('throws on weak AUTH_SECRET in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.STRESS_TEST_MODE = 'false'
    process.env.AUTH_SECRET = 'dev-short'
    process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64')
    expect(() => assertProductionInvariants()).toThrow(/AUTH_SECRET/)
  })

  it('does not throw in test environment with valid keys', () => {
    process.env.NODE_ENV = 'test'
    process.env.STRESS_TEST_MODE = 'false'
    process.env.AUTH_SECRET = 'x'.repeat(40)
    process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 2).toString('base64')
    expect(() => assertProductionInvariants()).not.toThrow()
  })
})
