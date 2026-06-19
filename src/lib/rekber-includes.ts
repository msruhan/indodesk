import type { RekberParty } from '@/lib/rekber-serializer'

export const REKBER_PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
} satisfies Record<keyof RekberParty, true>

export const REKBER_INCLUDE = {
  buyer: { select: REKBER_PARTY_SELECT },
  seller: { select: REKBER_PARTY_SELECT },
  inspectionOrder: { select: { orderCode: true } },
  complaint: { include: { media: true } },
  packagingProof: { include: { media: true } },
} as const

/** Tanpa relasi complaint/packaging — fallback bila tabel migrasi belum ada di production. */
export const REKBER_BASE_INCLUDE = {
  buyer: { select: REKBER_PARTY_SELECT },
  seller: { select: REKBER_PARTY_SELECT },
  inspectionOrder: { select: { orderCode: true } },
} as const

/** Kolom rekber yang ada sebelum migrasi fulfillment (aman di production lama). */
export const REKBER_LEGACY_SCALAR_SELECT = {
  id: true,
  orderCode: true,
  buyerId: true,
  sellerId: true,
  amount: true,
  fee: true,
  status: true,
  description: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  heldAt: true,
  releasedAt: true,
  disputedAt: true,
  refundedAt: true,
  inspectionOrderId: true,
} as const
