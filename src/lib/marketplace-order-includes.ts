export const MARKETPLACE_ORDER_PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const

export const MARKETPLACE_ORDER_INCLUDE = {
  buyer: { select: MARKETPLACE_ORDER_PARTY_SELECT },
  seller: { select: MARKETPLACE_ORDER_PARTY_SELECT },
  items: { include: { product: { select: { id: true, name: true, category: true } } } },
  complaint: { include: { media: true } },
  packagingProof: { include: { media: true } },
  cancellationRequest: true,
} as const
