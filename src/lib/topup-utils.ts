import type { TopupDenomination } from '@/data/topup-types'

export const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

export const compactNumber = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}jt`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}rb`
  return n.toString()
}

/** Effective (display) price after sale or flash sale. */
export const effectivePrice = (d: TopupDenomination) => {
  if (d.flashSale) return d.salePrice ?? d.basePrice
  return d.salePrice ?? d.basePrice
}

/** Generate a public order code: TT-XXXXX-YYYY */
export const generateOrderCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // omit confusing chars
  const part = (len: number) =>
    Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  const year = new Date().getFullYear()
  return `TT-${part(6)}-${year}`
}

export const groupBy = <T, K extends string | number>(
  arr: T[],
  key: (item: T) => K,
): Record<K, T[]> => {
  const out = {} as Record<K, T[]>
  for (const item of arr) {
    const k = key(item)
    if (!out[k]) out[k] = []
    out[k].push(item)
  }
  return out
}
