import type {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketRelatedType,
  SupportTicketStatus,
} from '@prisma/client'

export const SUPPORT_TICKET_CATEGORY_OPTIONS: Array<{
  value: SupportTicketCategory
  label: string
}> = [
  { value: 'SERVICE_ISSUE', label: 'Gangguan layanan' },
  { value: 'KONSULTASI', label: 'Konsultasi' },
  { value: 'INSPEKSI', label: 'Inspeksi' },
  { value: 'MARKETPLACE', label: 'Masalah order marketplace' },
  { value: 'ACCOUNT_SECURITY', label: 'Akun & keamanan' },
  { value: 'PLATFORM_BUG', label: 'Bug / error platform' },
  { value: 'OTHER', label: 'Lainnya' },
]

export const SUPPORT_TICKET_PRIORITY_OPTIONS: Array<{
  value: SupportTicketPriority
  label: string
}> = [
  { value: 'LOW', label: 'Rendah' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Tinggi' },
  { value: 'URGENT', label: 'Mendesak' },
]

export const SUPPORT_TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  OPEN: 'Baru',
  IN_PROGRESS: 'Diproses',
  WAITING_REPORTER: 'Menunggu pelapor',
  RESOLVED: 'Selesai',
}

export const SUPPORT_TICKET_RELATED_TYPE_LABELS: Record<SupportTicketRelatedType, string> = {
  KONSULTASI: 'Konsultasi',
  REMOTE: 'Remote',
  INSPEKSI: 'Inspeksi',
  MARKETPLACE_ORDER: 'Order marketplace',
  OTHER: 'Lainnya',
}

/** Tipe layanan yang relevan per kategori tiket (tanpa OTHER). */
export const SUPPORT_TICKET_CATEGORY_RELATED_TYPES: Record<
  SupportTicketCategory,
  readonly SupportTicketRelatedType[]
> = {
  SERVICE_ISSUE: ['REMOTE'],
  KONSULTASI: ['KONSULTASI'],
  INSPEKSI: ['INSPEKSI'],
  MARKETPLACE: ['MARKETPLACE_ORDER'],
  ACCOUNT_SECURITY: [],
  PLATFORM_BUG: [],
  OTHER: ['KONSULTASI', 'REMOTE', 'INSPEKSI', 'MARKETPLACE_ORDER'],
}

/** Kategori default saat form dibuka dengan deep-link layanan terkait. */
export const SUPPORT_TICKET_RELATED_TYPE_DEFAULT_CATEGORY: Partial<
  Record<SupportTicketRelatedType, SupportTicketCategory>
> = {
  KONSULTASI: 'KONSULTASI',
  REMOTE: 'SERVICE_ISSUE',
  INSPEKSI: 'INSPEKSI',
  MARKETPLACE_ORDER: 'MARKETPLACE',
}

export type RelatedServiceFilterItem = {
  type: SupportTicketRelatedType
  id: string | null
}

export function filterRelatedServicesForCategory<T extends RelatedServiceFilterItem>(
  items: T[],
  category: SupportTicketCategory,
): T[] {
  const allowed = new Set(SUPPORT_TICKET_CATEGORY_RELATED_TYPES[category])
  const otherOption = items.find((item) => item.type === 'OTHER')
  const filtered = items.filter(
    (item) => item.type !== 'OTHER' && allowed.has(item.type),
  )
  if (otherOption) filtered.push(otherOption)
  return filtered
}

export function relatedServiceOptionKey(item: RelatedServiceFilterItem): string {
  return item.type === 'OTHER' ? 'OTHER' : `${item.type}:${item.id}`
}

export const SUPPORT_TICKET_MAX_FILES = 5
export const SUPPORT_TICKET_PHOTO_MAX = 10 * 1024 * 1024
export const SUPPORT_TICKET_VIDEO_MAX = 50 * 1024 * 1024
export const SUPPORT_TICKET_RATE_LIMIT = 5
export const SUPPORT_TICKET_RATE_WINDOW_SECONDS = 3600
export const SUPPORT_TICKET_RELATED_LIMIT = 20

export type SupportTicketBasePath = '/user/bantuan/tiket' | '/teknisi/bantuan/tiket'

export function supportTicketBasePath(role: 'USER' | 'TEKNISI'): SupportTicketBasePath {
  return role === 'TEKNISI' ? '/teknisi/bantuan/tiket' : '/user/bantuan/tiket'
}

/** Daftar tiket di hub Pusat Bantuan vs halaman daftar mandiri (legacy). */
export function supportTicketListHref(basePath: SupportTicketBasePath): string {
  if (basePath === '/user/bantuan/tiket') return '/user/bantuan?tab=tiket'
  if (basePath === '/teknisi/bantuan/tiket') return '/teknisi/bantuan?tab=tiket'
  return basePath
}

export function supportTicketBackLabel(basePath: SupportTicketBasePath): string {
  if (basePath === '/user/bantuan/tiket' || basePath === '/teknisi/bantuan/tiket') {
    return '← Kembali ke Pusat Bantuan'
  }
  return '← Kembali ke daftar tiket'
}
