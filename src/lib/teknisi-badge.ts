import type { TeknisiProfile } from '@prisma/client'

/** Tier badge teknisi — satu sumber kebenaran untuk seluruh aplikasi. */
export type TeknisiBadgeTier = 'newbie' | 'verified' | 'top-teknisi'

export type TeknisiBadgeInput = {
  isVerified: boolean
  rating: number
  reviewCount: number
  /** Jumlah sesi layanan selesai (konsultasi + remote). */
  completedSessions: number
}

/** Syarat mendapatkan badge Top Teknisi. */
export const TOP_TEKNISI_CRITERIA = {
  minRating: 4.5,
  minReviews: 5,
  minCompletedSessions: 30,
  requiresVerified: true,
} as const

export const TEKNISI_BADGE_DISPLAY: Record<
  TeknisiBadgeTier,
  {
    shortLabel: string
    label: string
    description: string
  }
> = {
  'top-teknisi': {
    shortLabel: 'Top Teknisi',
    label: 'Top Teknisi',
    description: 'Teknisi terverifikasi dengan rating, ulasan, dan sesi layanan terbaik',
  },
  verified: {
    shortLabel: 'Terverifikasi',
    label: 'Terverifikasi',
    description: 'Teknisi terverifikasi platform',
  },
  newbie: {
    shortLabel: 'Teknisi',
    label: 'Teknisi Baru',
    description: 'Menunggu verifikasi atau belum memenuhi syarat Top Teknisi',
  },
}

export function teknisiBadgeInputFromProfile(
  profile: Pick<TeknisiProfile, 'isVerified' | 'rating' | 'reviewCount' | 'totalKonsultasi'>,
): TeknisiBadgeInput {
  return {
    isVerified: profile.isVerified,
    rating: Number(profile.rating),
    reviewCount: profile.reviewCount,
    completedSessions: profile.totalKonsultasi,
  }
}

export function qualifiesForTopTeknisi(input: TeknisiBadgeInput): boolean {
  if (TOP_TEKNISI_CRITERIA.requiresVerified && !input.isVerified) return false
  if (input.rating < TOP_TEKNISI_CRITERIA.minRating) return false
  if (input.reviewCount < TOP_TEKNISI_CRITERIA.minReviews) return false
  if (input.completedSessions < TOP_TEKNISI_CRITERIA.minCompletedSessions) return false
  return true
}

export function resolveTeknisiBadge(input: TeknisiBadgeInput): TeknisiBadgeTier {
  if (qualifiesForTopTeknisi(input)) return 'top-teknisi'
  if (input.isVerified) return 'verified'
  return 'newbie'
}

export function resolveTeknisiBadgeFromProfile(
  profile: Pick<TeknisiProfile, 'isVerified' | 'rating' | 'reviewCount' | 'totalKonsultasi'>,
): TeknisiBadgeTier {
  return resolveTeknisiBadge(teknisiBadgeInputFromProfile(profile))
}

export function getTeknisiBadgeLabel(tier: TeknisiBadgeTier): string {
  return TEKNISI_BADGE_DISPLAY[tier].label
}

export function getTeknisiBadgeShortLabel(tier: TeknisiBadgeTier): string {
  return TEKNISI_BADGE_DISPLAY[tier].shortLabel
}

export function describeTopTeknisiCriteria(): string {
  const c = TOP_TEKNISI_CRITERIA
  return `Terverifikasi, rating ≥ ${c.minRating}, minimal ${c.minReviews} ulasan, dan ${c.minCompletedSessions} sesi layanan selesai`
}

export function describeTopTeknisiProgress(input: TeknisiBadgeInput): string[] {
  const c = TOP_TEKNISI_CRITERIA
  const lines: string[] = []

  lines.push(input.isVerified ? '✓ Terverifikasi' : '○ Belum terverifikasi')
  lines.push(
    input.rating >= c.minRating
      ? `✓ Rating ${input.rating.toFixed(1)} (≥ ${c.minRating})`
      : `○ Rating ${input.rating.toFixed(1)} — butuh ≥ ${c.minRating}`,
  )
  lines.push(
    input.reviewCount >= c.minReviews
      ? `✓ ${input.reviewCount} ulasan (≥ ${c.minReviews})`
      : `○ ${input.reviewCount} ulasan — butuh ≥ ${c.minReviews}`,
  )
  lines.push(
    input.completedSessions >= c.minCompletedSessions
      ? `✓ ${input.completedSessions} sesi selesai (≥ ${c.minCompletedSessions})`
      : `○ ${input.completedSessions} sesi selesai — butuh ≥ ${c.minCompletedSessions}`,
  )

  return lines
}
