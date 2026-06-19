import type { PublicTeknisiDto } from '@/lib/teknisi-public'

export type TeknisiDigitalIdSource = Pick<
  PublicTeknisiDto,
  'id' | 'name' | 'specialty' | 'badge'
> & {
  isVerified: boolean
  /** ISO date — tahun member & valid thru dihitung dari sini */
  memberSinceAt: string
}

export function buildTeknisiCardNumber(userId: string): string {
  const hex = userId.replace(/[^0-9a-f]/gi, '').slice(0, 12).toUpperCase().padEnd(12, '0')
  return `BT-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`
}

export function buildTeknisiCardValidity(memberSinceAt: string | Date) {
  const joined = new Date(memberSinceAt)
  const memberSince = joined.getFullYear()
  const validYear = memberSince + 5
  return {
    memberSince,
    validYear,
    validThruLabel: `12/${String(validYear).slice(2)}`,
    validRangeLabel: `01/${String(memberSince).slice(2)} — 12/${String(validYear).slice(2)}`,
  }
}
