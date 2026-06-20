import { describe, expect, it } from 'vitest'
import {
  buildShippingLabelQrUrl,
  canAccessShippingLabel,
  orderEligibleForShippingLabel,
  resolveShippingLabelRedirect,
} from '@/lib/shipping-label'

const baseOrder = {
  id: 'ord-1',
  buyerId: 'buyer-1',
  sellerId: 'seller-1',
  status: 'PROCESSING' as const,
  shippingAddress: 'Jl. Merdeka No. 1, Bandung',
  items: [{ product: { category: 'SMARTPHONE' as const }, quantity: 1 }],
}

describe('orderEligibleForShippingLabel', () => {
  it('allows PROCESSING physical orders with address', () => {
    expect(orderEligibleForShippingLabel(baseOrder)).toBe(true)
  })

  it('allows SHIPPED', () => {
    expect(orderEligibleForShippingLabel({ ...baseOrder, status: 'SHIPPED' })).toBe(true)
  })

  it('rejects PAID', () => {
    expect(orderEligibleForShippingLabel({ ...baseOrder, status: 'PAID' })).toBe(false)
  })

  it('rejects software-only orders', () => {
    expect(
      orderEligibleForShippingLabel({
        ...baseOrder,
        items: [{ product: { category: 'SOFTWARE' }, quantity: 1 }],
      }),
    ).toBe(false)
  })

  it('rejects missing address', () => {
    expect(orderEligibleForShippingLabel({ ...baseOrder, shippingAddress: null })).toBe(false)
  })
})

describe('canAccessShippingLabel', () => {
  it('allows buyer, seller, admin', () => {
    expect(canAccessShippingLabel('buyer-1', 'USER', baseOrder)).toBe(true)
    expect(canAccessShippingLabel('seller-1', 'TEKNISI', baseOrder)).toBe(true)
    expect(canAccessShippingLabel('other', 'ADMIN', baseOrder)).toBe(true)
  })

  it('denies unrelated user', () => {
    expect(canAccessShippingLabel('stranger', 'USER', baseOrder)).toBe(false)
  })
})

describe('resolveShippingLabelRedirect', () => {
  it('redirects buyer to order detail', () => {
    expect(resolveShippingLabelRedirect(baseOrder, 'buyer-1', 'USER')).toBe('/user/orders/ord-1')
  })

  it('redirects seller to pesanan with focus', () => {
    expect(resolveShippingLabelRedirect(baseOrder, 'seller-1', 'TEKNISI')).toBe(
      '/teknisi/pesanan?focus=ord-1',
    )
  })

  it('redirects admin to dashboard', () => {
    expect(resolveShippingLabelRedirect(baseOrder, 'admin-1', 'ADMIN')).toBe('/admin/dashboard')
  })

  it('returns null for unauthorized', () => {
    expect(resolveShippingLabelRedirect(baseOrder, 'stranger', 'USER')).toBeNull()
  })
})

describe('buildShippingLabelQrUrl', () => {
  it('uses app base url and token path', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://bantoo.in'
    expect(buildShippingLabelQrUrl('abc123')).toBe('https://bantoo.in/l/abc123')
  })
})
