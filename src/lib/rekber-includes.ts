import type { RekberParty } from '@/lib/rekber-serializer'

export const REKBER_PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} satisfies Record<keyof RekberParty, true>

export const REKBER_INCLUDE = {
  buyer: { select: REKBER_PARTY_SELECT },
  seller: { select: REKBER_PARTY_SELECT },
  inspectionOrder: { select: { orderCode: true } },
  complaint: { include: { media: true } },
  packagingProof: { include: { media: true } },
} as const
