import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  telegramNotificationTemplate: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}))

import {
  getEffectiveTemplate,
  resetTemplateOverride,
} from '@/lib/telegram/template-store'

describe('template-store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('falls back to default when no override', async () => {
    prismaMock.telegramNotificationTemplate.findUnique.mockResolvedValue(null)
    const result = await getEffectiveTemplate('product.published')
    expect(result.isEnabled).toBe(true)
    expect(result.body).toContain('Produk Baru di Marketplace')
  })

  it('uses db override when present', async () => {
    prismaMock.telegramNotificationTemplate.findUnique.mockResolvedValue({
      eventKey: 'product.published',
      body: 'Custom body {{namaProduk}}',
      isEnabled: false,
      updatedAt: new Date(),
    })
    const result = await getEffectiveTemplate('product.published')
    expect(result.body).toBe('Custom body {{namaProduk}}')
    expect(result.isEnabled).toBe(false)
  })

  it('reset deletes override row', async () => {
    prismaMock.telegramNotificationTemplate.deleteMany.mockResolvedValue({ count: 1 })
    await resetTemplateOverride('konsultasi.new')
    expect(prismaMock.telegramNotificationTemplate.deleteMany).toHaveBeenCalledWith({
      where: { eventKey: 'konsultasi.new' },
    })
  })
})
