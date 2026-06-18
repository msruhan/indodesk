import type { DeviceType, ProductCategory } from '@prisma/client'

export const PRODUCT_CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: 'IPHONE', label: 'iPhone' },
  { value: 'ANDROID', label: 'Android' },
  { value: 'IPAD', label: 'iPad' },
  { value: 'MACBOOK', label: 'Macbook' },
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'PC', label: 'PC' },
  { value: 'AKSESORIS', label: 'Aksesoris' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'LAINNYA', label: 'Lainnya' },
]

export const PRODUCT_CATEGORY_SLUG: Record<ProductCategory, string> = {
  IPHONE: 'iphone',
  ANDROID: 'android',
  IPAD: 'ipad',
  MACBOOK: 'macbook',
  LAPTOP: 'laptop',
  PC: 'pc',
  AKSESORIS: 'aksesoris',
  SOFTWARE: 'software',
  LAINNYA: 'lainnya',
}

/** Slug filter marketplace → satu atau beberapa kategori DB. */
export const MARKETPLACE_CATEGORY_SLUGS: Record<string, ProductCategory[]> = {
  iphone: ['IPHONE'],
  android: ['ANDROID'],
  ipad: ['IPAD'],
  macbook: ['MACBOOK'],
  laptop: ['LAPTOP'],
  pc: ['PC'],
  aksesoris: ['AKSESORIS'],
  software: ['SOFTWARE'],
  lainnya: ['LAINNYA'],
  // legacy grouping
  handphone: ['IPHONE', 'ANDROID'],
  tablet: ['IPAD'],
}

export const CATEGORIES_WITH_SPECS: ProductCategory[] = [
  'IPHONE',
  'ANDROID',
  'IPAD',
  'MACBOOK',
  'LAPTOP',
  'PC',
]

export const BENCHMARKABLE_CATEGORIES: ProductCategory[] = [
  'IPHONE',
  'ANDROID',
  'IPAD',
  'MACBOOK',
  'LAPTOP',
  'PC',
]

export type SpecProfile = 'mobile' | 'computer'

export function categoryLabel(category: ProductCategory | string): string {
  return (
    PRODUCT_CATEGORY_OPTIONS.find((c) => c.value === category)?.label ??
    String(category)
  )
}

export function deviceTypeForCategory(category: ProductCategory): DeviceType | null {
  switch (category) {
    case 'IPHONE':
      return 'IPHONE'
    case 'ANDROID':
      return 'ANDROID_PHONE'
    case 'IPAD':
      return 'IPAD'
    default:
      return null
  }
}

export function categorySpecProfile(category: ProductCategory): SpecProfile | null {
  if (category === 'IPHONE' || category === 'ANDROID' || category === 'IPAD') return 'mobile'
  if (category === 'MACBOOK' || category === 'LAPTOP' || category === 'PC') return 'computer'
  return null
}

export function categoryRequiresSpecs(category: ProductCategory): boolean {
  return CATEGORIES_WITH_SPECS.includes(category)
}

export function categorySupportsBenchmark(category: ProductCategory): boolean {
  return BENCHMARKABLE_CATEGORIES.includes(category)
}

export function categorySupportsThreeUtools(category: ProductCategory): boolean {
  return category === 'IPHONE' || category === 'IPAD'
}

export function categoryRequiresColor(category: ProductCategory): boolean {
  return categorySpecProfile(category) === 'mobile'
}

export function categoryRequiresRam(category: ProductCategory): boolean {
  return category === 'ANDROID' || categorySpecProfile(category) === 'computer'
}

export function categoryRamOptional(category: ProductCategory): boolean {
  return category === 'IPHONE' || category === 'IPAD'
}

export function categoryRequiresProcessor(category: ProductCategory): boolean {
  return categorySpecProfile(category) === 'computer'
}
