import type { RekberComplaint, RekberComplaintMedia } from '@prisma/client'

export type RekberComplaintMediaDto = {
  id: string
  type: 'DEFECT_PHOTO' | 'UNBOXING_VIDEO'
  typeLabel: string
  url: string
  mimeType: string
}

const MEDIA_TYPE_LABELS: Record<RekberComplaintMediaDto['type'], string> = {
  DEFECT_PHOTO: 'Foto masalah',
  UNBOXING_VIDEO: 'Video unboxing',
}

export type RekberComplaintDto = {
  id: string
  reason: string
  status: RekberComplaint['status']
  statusLabel: string
  sellerResponse: string | null
  sellerRespondedAt: string | null
  sellerDeadline: string
  escalatedAt: string | null
  resolvedAt: string | null
  resolution: RekberComplaint['resolution']
  refundAmount: number | null
  adminNote: string | null
  media: RekberComplaintMediaDto[]
  createdAt: string
}

const STATUS_LABELS: Record<RekberComplaint['status'], string> = {
  OPEN: 'Menunggu respons penjual',
  SELLER_RESPONDED: 'Penjual sudah merespons',
  ESCALATED: 'Dieskalasi ke admin',
  RESOLVED: 'Selesai',
  WITHDRAWN: 'Ditarik',
}

export function serializeRekberComplaint(
  row: RekberComplaint & { media: RekberComplaintMedia[] },
): RekberComplaintDto {
  return {
    id: row.id,
    reason: row.reason,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status],
    sellerResponse: row.sellerResponse,
    sellerRespondedAt: row.sellerRespondedAt?.toISOString() ?? null,
    sellerDeadline: row.sellerDeadline.toISOString(),
    escalatedAt: row.escalatedAt?.toISOString() ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    resolution: row.resolution,
    refundAmount: row.refundAmount != null ? Number(row.refundAmount) : null,
    adminNote: row.adminNote,
    media: row.media
      .filter((m): m is RekberComplaintMedia & { type: RekberComplaintMediaDto['type'] } =>
        m.type === 'DEFECT_PHOTO' || m.type === 'UNBOXING_VIDEO',
      )
      .map((m) => ({
        id: m.id,
        type: m.type,
        typeLabel: MEDIA_TYPE_LABELS[m.type],
        url: m.url,
        mimeType: m.mimeType,
      })),
    createdAt: row.createdAt.toISOString(),
  }
}
