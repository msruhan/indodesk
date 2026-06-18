import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  telegramLinkToken: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}))

import { consumeTelegramLinkToken, issueTelegramLinkToken } from '@/lib/telegram/link-token'

describe('Telegram link token service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.telegramLinkToken.deleteMany.mockResolvedValue({ count: 0 })
    prismaMock.telegramLinkToken.create.mockResolvedValue({ id: 'row-1' })
  })

  it('issues token and stores hash', async () => {
    const token = await issueTelegramLinkToken('user-abc')
    expect(token).toMatch(/^[a-f0-9]{64}$/)
    expect(prismaMock.telegramLinkToken.create).toHaveBeenCalledOnce()
    const data = prismaMock.telegramLinkToken.create.mock.calls[0][0].data
    expect(data.userId).toBe('user-abc')
    expect(data.tokenHash).not.toBe(token)
  })

  it('consumes token once', async () => {
    const token = 'a'.repeat(64)
    prismaMock.telegramLinkToken.findUnique.mockResolvedValue({
      id: 'row-1',
      userId: 'user-abc',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    })
    prismaMock.telegramLinkToken.updateMany.mockResolvedValueOnce({ count: 1 })
    prismaMock.telegramLinkToken.updateMany.mockResolvedValueOnce({ count: 0 })

    const userId = await consumeTelegramLinkToken(token)
    expect(userId).toBe('user-abc')

    const second = await consumeTelegramLinkToken(token)
    expect(second).toBeNull()
  })
})
