import type { OrderComplaint, OrderComplaintMedia } from '@prisma/client'

export type OrderComplaintMediaDto = {
  id: string
  type:
    | 'PHOTO'
    | 'VIDEO'
    | 'UNBOXING_VIDEO'
    | 'DEFECT_PHOTO'
    | 'RETURN_PHOTO'
    | 'RETURN_VIDEO'
    | 'RETURN_REJECT_PHOTO'
  typeLabel: string
  url: string
  mimeType: string
}

const MEDIA_TYPE_LABELS: Record<OrderComplaintMediaDto['type'], string> = {
  PHOTO: 'Foto bukti',
  VIDEO: 'Video bukti',
  UNBOXING_VIDEO: 'Video unboxing',
  DEFECT_PHOTO: 'Foto masalah',
  RETURN_PHOTO: 'Foto pengemasan retur',
  RETURN_VIDEO: 'Video pengiriman retur',
  RETURN_REJECT_PHOTO: 'Foto penolakan retur',
}

export type SellerReturnAddressDto = {
  storeName: string
  address: string | null
  city: string | null
  phone: string | null
}

export type OrderComplaintDto = {
  id: string
  reason: string
  status: OrderComplaint['status']
  statusLabel: string
  sellerResponse: string | null
  sellerRespondedAt: string | null
  sellerDeadline: string
  returnDeadline: string | null
  sellerConfirmDeadline: string | null
  returnShippedAt: string | null
  returnDeliveredAt: string | null
  returnCourier: OrderComplaint['returnCourier']
  returnTrackingNumber: string | null
  returnSummaryStatus: string | null
  sellerReturnRejectReason: string | null
  escalatedAt: string | null
  resolvedAt: string | null
  resolution: OrderComplaint['resolution']
  media: OrderComplaintMediaDto[]
  returnAddress: SellerReturnAddressDto | null
  createdAt: string
}

const STATUS_LABELS: Record<OrderComplaint['status'], string> = {
  OPEN: 'Menunggu respons penjual',
  SELLER_RESPONDED: 'Penjual sudah merespons',
  AWAITING_RETURN: 'Kirim barang retur',
  RETURN_SHIPPED: 'Retur dalam perjalanan',
  AWAITING_SELLER_CONFIRM: 'Menunggu konfirmasi penjual',
  ESCALATED: 'Dieskalasi ke admin',
  RESOLVED: 'Selesai',
  WITHDRAWN: 'Ditarik',
  RETURN_EXPIRED: 'Batas kirim retur lewat',
}

export function serializeOrderComplaint(
  row: OrderComplaint & { media: OrderComplaintMedia[] },
  opts?: { returnAddress?: SellerReturnAddressDto | null },
): OrderComplaintDto {
  return {
    id: row.id,
    reason: row.reason,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status],
    sellerResponse: row.sellerResponse,
    sellerRespondedAt: row.sellerRespondedAt?.toISOString() ?? null,
    sellerDeadline: row.sellerDeadline.toISOString(),
    returnDeadline: row.returnDeadline?.toISOString() ?? null,
    sellerConfirmDeadline: row.sellerConfirmDeadline?.toISOString() ?? null,
    returnShippedAt: row.returnShippedAt?.toISOString() ?? null,
    returnDeliveredAt: row.returnDeliveredAt?.toISOString() ?? null,
    returnCourier: row.returnCourier,
    returnTrackingNumber: row.returnTrackingNumber,
    returnSummaryStatus: row.returnSummaryStatus,
    sellerReturnRejectReason: row.sellerReturnRejectReason,
    escalatedAt: row.escalatedAt?.toISOString() ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    resolution: row.resolution,
    media: row.media.map((m) => ({
      id: m.id,
      type: m.type,
      typeLabel: MEDIA_TYPE_LABELS[m.type],
      url: m.url,
      mimeType: m.mimeType,
    })),
    returnAddress: opts?.returnAddress ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}
