export type PlatformRevenueChannel = 'marketplace' | 'rekber' | 'inspeksi' | 'konsultasi'

export type PlatformRevenuePhase = 'realized' | 'estimated'

export type ChannelRevenueStats = {
  realized: string
  estimated: string
  countRealized: number
  countEstimated: number
  gmvRealized?: string
  note?: string
}

export type PlatformRevenueRecentRow = {
  id: string
  channel: PlatformRevenueChannel
  orderCode: string
  fee: string
  phase: PlatformRevenuePhase
  occurredAt: string
  href: string
}

export type PlatformRevenueSummary = {
  realized: { total: string; today: string; last30d: string }
  estimated: { total: string }
  byChannel: Record<PlatformRevenueChannel, ChannelRevenueStats>
  charts: {
    mix: Array<{ channel: PlatformRevenueChannel; label: string; amount: string; color: string }>
    daily: {
      labels: string[]
      marketplace: number[]
      rekber: number[]
      inspeksi: number[]
    }
  }
  recent: PlatformRevenueRecentRow[]
}

export const CHANNEL_LABELS: Record<PlatformRevenueChannel, string> = {
  marketplace: 'Marketplace',
  rekber: 'Rekber',
  inspeksi: 'Inspeksi',
  konsultasi: 'Konsultasi',
}

export const CHANNEL_COLORS: Record<PlatformRevenueChannel, string> = {
  marketplace: '#8b5cf6',
  rekber: '#ec4899',
  inspeksi: '#10b981',
  konsultasi: '#06b6d4',
}
