import { ProductCategory, ProductWarranty } from '@prisma/client'

export const PRODUCT_WARRANTY_OPTIONS = [
  { value: ProductWarranty.NONE, label: 'Tidak ada garansi' },
  { value: ProductWarranty.OFFICIAL, label: 'Garansi Resmi' },
  { value: ProductWarranty.STORE, label: 'Garansi Toko' },
] as const

export const HANDPHONE_COMPLETENESS_OPTIONS = [
  { value: 'HANDPHONE', label: 'Handphone' },
  { value: 'CHARGER', label: 'Charger' },
  { value: 'HEADSET', label: 'Headset' },
  { value: 'BOX', label: 'Box' },
  { value: 'UNIT_ONLY', label: 'Unit Only' },
  { value: 'FULLSET', label: 'Fullset' },
] as const

export const LAPTOP_COMPLETENESS_OPTIONS = [
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'CHARGER', label: 'Charger' },
  { value: 'BOX', label: 'Box' },
  { value: 'MOUSE', label: 'Mouse' },
  { value: 'BAG', label: 'Tas' },
  { value: 'UNIT_ONLY', label: 'Unit Only' },
  { value: 'FULLSET', label: 'Fullset' },
] as const

export type HandphoneCompletenessKey = (typeof HANDPHONE_COMPLETENESS_OPTIONS)[number]['value']
export type LaptopCompletenessKey = (typeof LAPTOP_COMPLETENESS_OPTIONS)[number]['value']
export type ProductCompletenessKey = HandphoneCompletenessKey | LaptopCompletenessKey

const COMPLETENESS_LABELS: Record<string, string> = {
  ...Object.fromEntries(HANDPHONE_COMPLETENESS_OPTIONS.map((o) => [o.value, o.label])),
  ...Object.fromEntries(LAPTOP_COMPLETENESS_OPTIONS.map((o) => [o.value, o.label])),
}

const BUNDLE_EXCLUSIVE = ['UNIT_ONLY', 'FULLSET'] as const

export const CATEGORIES_WITH_SPECS: ProductCategory[] = ['HANDPHONE', 'LAPTOP']

export function categoryRequiresSpecs(category: ProductCategory): boolean {
  return CATEGORIES_WITH_SPECS.includes(category)
}

export function getCompletenessOptionsForCategory(category: ProductCategory) {
  if (category === 'LAPTOP') return LAPTOP_COMPLETENESS_OPTIONS
  if (category === 'HANDPHONE') return HANDPHONE_COMPLETENESS_OPTIONS
  return []
}

export function warrantyLabel(warranty: ProductWarranty): string {
  return PRODUCT_WARRANTY_OPTIONS.find((o) => o.value === warranty)?.label ?? warranty
}

export function completenessLabel(key: string): string {
  return COMPLETENESS_LABELS[key] ?? key
}

export function parseCompletenessJson(
  raw: unknown,
  category?: ProductCategory,
): ProductCompletenessKey[] {
  if (!Array.isArray(raw)) return []
  const valid = new Set<string>(
    getCompletenessOptionsForCategory(category ?? 'HANDPHONE').map((o) => o.value),
  )
  return raw.filter(
    (v): v is ProductCompletenessKey => typeof v === 'string' && valid.has(v),
  )
}

export function formatCompletenessList(keys: ProductCompletenessKey[]): string {
  return keys.map(completenessLabel).join(', ')
}

function getGranularKeys(category: ProductCategory): string[] {
  if (category === 'LAPTOP') {
    return ['LAPTOP', 'CHARGER', 'BOX', 'MOUSE', 'BAG']
  }
  return ['HANDPHONE', 'CHARGER', 'HEADSET', 'BOX']
}

export function toggleCompletenessSelection(
  selected: ProductCompletenessKey[],
  key: ProductCompletenessKey,
  category: ProductCategory,
): ProductCompletenessKey[] {
  if (BUNDLE_EXCLUSIVE.includes(key as (typeof BUNDLE_EXCLUSIVE)[number])) {
    return selected.includes(key) ? [] : [key]
  }

  const withoutBundles = selected.filter(
    (s) => !BUNDLE_EXCLUSIVE.includes(s as (typeof BUNDLE_EXCLUSIVE)[number]),
  )
  if (withoutBundles.includes(key)) {
    return withoutBundles.filter((s) => s !== key)
  }
  return [...withoutBundles, key]
}

export type ProductSpecsFormState = {
  color: string
  ram: string
  processor: string
  storage: string
  warranty: ProductWarranty
  completeness: ProductCompletenessKey[]
}

export const emptyProductSpecsForm: ProductSpecsFormState = {
  color: '',
  ram: '',
  processor: '',
  storage: '',
  warranty: ProductWarranty.NONE,
  completeness: [],
}

export type ProductSpecsInput = ProductSpecsFormState & {
  category: ProductCategory
}

export function parseProductSpecsFromForm(
  form: FormData,
  category: ProductCategory,
): ProductSpecsInput {
  const color = String(form.get('color') ?? '').trim()
  const ram = String(form.get('ram') ?? '').trim()
  const processor = String(form.get('processor') ?? '').trim()
  const storage = String(form.get('storage') ?? '').trim()
  const warranty = String(form.get('warranty') ?? ProductWarranty.NONE) as ProductWarranty

  let completeness: ProductCompletenessKey[] = []
  const rawJson = form.get('completeness')
  if (typeof rawJson === 'string' && rawJson.trim()) {
    try {
      completeness = parseCompletenessJson(JSON.parse(rawJson), category)
    } catch {
      completeness = []
    }
  } else {
    completeness = parseCompletenessJson(form.getAll('completeness'), category)
  }

  return { category, color, ram, processor, storage, warranty, completeness }
}

function validateCompleteness(
  completeness: ProductCompletenessKey[],
  category: ProductCategory,
): string | null {
  if (completeness.length === 0) return 'Pilih minimal satu kelengkapan'

  const granular = getGranularKeys(category)
  const hasBundle = completeness.some((k) =>
    BUNDLE_EXCLUSIVE.includes(k as (typeof BUNDLE_EXCLUSIVE)[number]),
  )
  const hasGranular = completeness.some((k) => granular.includes(k as string))
  if (hasBundle && hasGranular) {
    return 'Unit Only / Fullset tidak bisa digabung dengan pilihan lain'
  }
  if (
    completeness.filter((k) =>
      BUNDLE_EXCLUSIVE.includes(k as (typeof BUNDLE_EXCLUSIVE)[number]),
    ).length > 1
  ) {
    return 'Pilih hanya Unit Only atau Fullset'
  }
  return null
}

export function validateProductSpecs(input: ProductSpecsInput): string | null {
  if (!categoryRequiresSpecs(input.category)) return null

  if (!Object.values(ProductWarranty).includes(input.warranty)) {
    return 'Garansi tidak valid'
  }

  if (input.category === 'HANDPHONE') {
    if (!input.color) return 'Warna wajib diisi'
    if (!input.storage) return 'Storage wajib diisi'
    return validateCompleteness(input.completeness, input.category)
  }

  if (input.category === 'LAPTOP') {
    if (!input.ram) return 'RAM wajib diisi'
    if (!input.storage) return 'Storage wajib diisi'
    if (!input.processor) return 'Processor wajib diisi'
    return validateCompleteness(input.completeness, input.category)
  }

  return null
}

export function specsToDb(input: ProductSpecsInput) {
  return {
    color: input.category === 'HANDPHONE' ? input.color : '',
    ram: input.category === 'LAPTOP' ? input.ram : '',
    processor: input.category === 'LAPTOP' ? input.processor : '',
    storage: input.storage,
    warranty: input.warranty,
    completeness: input.completeness as unknown as object,
  }
}

export type ProductSpecDisplayRow = { label: string; value: string }

export function getProductSpecDisplayRows(
  category: ProductCategory,
  data: {
    color: string
    ram: string
    processor: string
    storage: string
    warranty: ProductWarranty
    completeness: ProductCompletenessKey[]
  },
): ProductSpecDisplayRow[] {
  if (category === 'HANDPHONE') {
    return [
      { label: 'Warna', value: data.color },
      { label: 'Storage', value: data.storage },
      { label: 'Garansi', value: warrantyLabel(data.warranty) },
    ].filter((r) => r.value)
  }

  if (category === 'LAPTOP') {
    return [
      { label: 'RAM', value: data.ram },
      { label: 'Storage', value: data.storage },
      { label: 'Processor', value: data.processor },
      { label: 'Garansi', value: warrantyLabel(data.warranty) },
    ].filter((r) => r.value)
  }

  return []
}
