import type {
  InspectionDeviceCategory,
  InspectionMode,
  InspectionOrderStatus,
  InspectionOverallCondition,
  InspectionProductSource,
  InspectionRecommendation,
} from '@prisma/client'

export function inspectionModeLabel(mode: InspectionMode): string {
  return mode === 'ONLINE' ? 'Online (dipandu)' : 'Offline (datang ke lokasi)'
}

export function inspectionCategoryLabel(category: InspectionDeviceCategory): string {
  return category === 'HANDPHONE' ? 'Handphone' : 'Laptop'
}

export function inspectionSourceLabel(source: InspectionProductSource): string {
  const map: Record<InspectionProductSource, string> = {
    INDOTEKNIZII: 'Marketplace IndoTeknizi',
    TOKOPEDIA: 'Tokopedia',
    SHOPEE: 'Shopee',
    OLX: 'OLX',
    FACEBOOK_MARKETPLACE: 'Facebook Marketplace',
    PRIVATE: 'Penjual pribadi',
    OTHER: 'Lainnya',
  }
  return map[source] ?? source
}

export type InspectionUiStatus =
  | 'waiting'
  | 'accepted'
  | 'in_progress'
  | 'report_ready'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'disputed'

export function mapInspectionUiStatus(status: InspectionOrderStatus): InspectionUiStatus {
  switch (status) {
    case 'PAID':
      return 'waiting'
    case 'ACCEPTED':
      return 'accepted'
    case 'IN_PROGRESS':
      return 'in_progress'
    case 'REPORT_SUBMITTED':
      return 'report_ready'
    case 'COMPLETED':
      return 'completed'
    case 'REJECTED':
      return 'rejected'
    case 'CANCELLED':
      return 'cancelled'
    case 'DISPUTED':
      return 'disputed'
    default:
      return 'waiting'
  }
}

export function inspectionStatusLabel(ui: InspectionUiStatus): string {
  const map: Record<InspectionUiStatus, string> = {
    waiting: 'Menunggu teknisi',
    accepted: 'Diterima',
    in_progress: 'Sedang inspeksi',
    report_ready: 'Laporan siap',
    completed: 'Selesai',
    rejected: 'Ditolak teknisi',
    cancelled: 'Dibatalkan',
    disputed: 'Sengketa',
  }
  return map[ui]
}

export function overallConditionLabel(c: InspectionOverallCondition): string {
  const map: Record<InspectionOverallCondition, string> = {
    EXCELLENT: 'Sangat baik',
    GOOD: 'Baik',
    FAIR: 'Cukup',
    POOR: 'Buruk',
  }
  return map[c]
}

export function recommendationLabel(r: InspectionRecommendation): string {
  const map: Record<InspectionRecommendation, string> = {
    RECOMMENDED: 'Layak beli',
    NEGOTIATE: 'Negosiasi harga',
    NOT_RECOMMENDED: 'Tidak disarankan',
  }
  return map[r]
}
