import type {
  OrderPackagingMedia,
  OrderPackagingProof,
  RekberPackagingMedia,
  RekberPackagingProof,
} from '@prisma/client'

export type OrderPackagingMediaDto = {
  id: string
  type: 'PHOTO' | 'VIDEO'
  url: string
  mimeType: string
}

export type OrderPackagingProofDto = {
  id: string
  status: OrderPackagingProof['status']
  statusLabel: string
  rejectionNote: string | null
  submittedAt: string | null
  rejectedAt: string | null
  resubmitDeadline: string | null
  reviewedAt: string | null
  media: OrderPackagingMediaDto[]
}

const STATUS_LABELS: Record<OrderPackagingProof['status'], string> = {
  PENDING: 'Menunggu review admin',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak — upload ulang',
}

type PackagingProofRow = {
  id: string
  status: OrderPackagingProof['status']
  rejectionNote: string | null
  submittedAt: Date | null
  rejectedAt: Date | null
  resubmitDeadline: Date | null
  reviewedAt: Date | null
  media: Array<Pick<OrderPackagingMedia | RekberPackagingMedia, 'id' | 'type' | 'url' | 'mimeType'>>
}

function serializePackagingProofRow(row: PackagingProofRow): OrderPackagingProofDto {
  return {
    id: row.id,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status],
    rejectionNote: row.rejectionNote,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    rejectedAt: row.rejectedAt?.toISOString() ?? null,
    resubmitDeadline: row.resubmitDeadline?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    media: row.media.map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      mimeType: m.mimeType,
    })),
  }
}

export function serializeOrderPackagingProof(
  row: OrderPackagingProof & { media: OrderPackagingMedia[] },
): OrderPackagingProofDto {
  return serializePackagingProofRow(row)
}

export function serializeRekberPackagingProof(
  row: RekberPackagingProof & { media: RekberPackagingMedia[] },
): OrderPackagingProofDto {
  return serializePackagingProofRow(row)
}
