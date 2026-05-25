/**
 * Data helper — pick random data untuk variasi request.
 */

const SEARCH_QUERIES = [
  'iphone',
  'samsung',
  'unlock',
  'flash',
  'imei',
  'remote',
  'konsultasi',
  'jakarta',
]

const PRODUCT_CATEGORIES = ['HARDWARE', 'SOFTWARE', 'TOOL', 'AKSESORIS', 'LAINNYA']

export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomSearchQuery() {
  return randomItem(SEARCH_QUERIES)
}

export function randomCategory() {
  return randomItem(PRODUCT_CATEGORIES)
}

export function randomPage() {
  return Math.floor(Math.random() * 3) + 1
}

export function thinkTimeShort() {
  return 1 + Math.random() * 2
}

export function thinkTimeNormal() {
  return 2 + Math.random() * 3
}

export function thinkTimeLong() {
  return 5 + Math.random() * 5
}
