import { ProductCategory, ProductWarranty } from '@prisma/client'
import type { ConditionGrade, DeviceType } from '@prisma/client'
import {
  CATEGORIES_WITH_SPECS,
  categoryRequiresColor,
  categoryRequiresProcessor,
  categoryRequiresRam,
  categoryRequiresSpecs,
  categorySpecProfile,
  deviceTypeForCategory,
} from '@/lib/product-category-config'

export { CATEGORIES_WITH_SPECS, categoryRequiresSpecs }

export const PRODUCT_WARRANTY_OPTIONS = [
  { value: ProductWarranty.NONE, label: 'Tidak ada garansi' },
  { value: ProductWarranty.OFFICIAL, label: 'Garansi Resmi' },
  { value: ProductWarranty.STORE, label: 'Garansi Toko' },
] as const

const BUNDLE_EXCLUSIVE = ['UNIT_ONLY', 'FULLSET'] as const

type CompletenessOption = { value: string; label: string }

const MOBILE_BASE: CompletenessOption[] = [
  { value: 'CHARGER', label: 'Charger' },
  { value: 'CABLE', label: 'Kabel' },
  { value: 'BOX', label: 'Box' },
  { value: 'UNIT_ONLY', label: 'Unit Only' },
  { value: 'FULLSET', label: 'Fullset' },
]

const IPHONE_COMPLETENESS: CompletenessOption[] = [
  { value: 'IPHONE', label: 'iPhone' },
  { value: 'HEADSET', label: 'Headset' },
  ...MOBILE_BASE,
]

const ANDROID_COMPLETENESS: CompletenessOption[] = [
  { value: 'ANDROID', label: 'Handphone' },
  { value: 'HEADSET', label: 'Headset' },
  ...MOBILE_BASE,
]

const IPAD_COMPLETENESS: CompletenessOption[] = [
  { value: 'IPAD', label: 'iPad' },
  { value: 'PENCIL', label: 'Apple Pencil' },
  ...MOBILE_BASE,
]

const MACBOOK_COMPLETENESS: CompletenessOption[] = [
  { value: 'MACBOOK', label: 'Macbook' },
  { value: 'CHARGER', label: 'Charger' },
  { value: 'ADAPTER', label: 'Adaptor' },
  { value: 'BOX', label: 'Box' },
  { value: 'UNIT_ONLY', label: 'Unit Only' },
  { value: 'FULLSET', label: 'Fullset' },
]

const LAPTOP_COMPLETENESS: CompletenessOption[] = [
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'CHARGER', label: 'Charger' },
  { value: 'BOX', label: 'Box' },
  { value: 'MOUSE', label: 'Mouse' },
  { value: 'BAG', label: 'Tas' },
  { value: 'UNIT_ONLY', label: 'Unit Only' },
  { value: 'FULLSET', label: 'Fullset' },
]

const PC_COMPLETENESS: CompletenessOption[] = [
  { value: 'PC', label: 'PC / CPU' },
  { value: 'MONITOR', label: 'Monitor' },
  { value: 'KEYBOARD', label: 'Keyboard' },
  { value: 'MOUSE', label: 'Mouse' },
  { value: 'BOX', label: 'Box' },
  { value: 'UNIT_ONLY', label: 'Unit Only' },
  { value: 'FULLSET', label: 'Fullset' },
]

/** Legacy keys from data lama */
const LEGACY_COMPLETENESS: CompletenessOption[] = [
  { value: 'HANDPHONE', label: 'Handphone' },
]

const ALL_COMPLETENESS = [
  ...IPHONE_COMPLETENESS,
  ...ANDROID_COMPLETENESS,
  ...IPAD_COMPLETENESS,
  ...MACBOOK_COMPLETENESS,
  ...LAPTOP_COMPLETENESS,
  ...PC_COMPLETENESS,
  ...LEGACY_COMPLETENESS,
]

export type ProductCompletenessKey = string

const COMPLETENESS_LABELS: Record<string, string> = Object.fromEntries(
  ALL_COMPLETENESS.map((o) => [o.value, o.label]),
)

export function getCompletenessOptionsForCategory(category: ProductCategory): CompletenessOption[] {
  switch (category) {
    case 'IPHONE':
      return IPHONE_COMPLETENESS
    case 'ANDROID':
      return ANDROID_COMPLETENESS
    case 'IPAD':
      return IPAD_COMPLETENESS
    case 'MACBOOK':
      return MACBOOK_COMPLETENESS
    case 'LAPTOP':
      return LAPTOP_COMPLETENESS
    case 'PC':
      return PC_COMPLETENESS
    default:
      return []
  }
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
    getCompletenessOptionsForCategory(category ?? 'IPHONE').map((o) => o.value),
  )
  // izinkan legacy key HANDPHONE untuk produk lama
  if (category === 'IPHONE' || category === 'ANDROID') valid.add('HANDPHONE')
  return raw.filter((v): v is ProductCompletenessKey => typeof v === 'string' && valid.has(v))
}

export function formatCompletenessList(keys: ProductCompletenessKey[]): string {
  return keys.map(completenessLabel).join(', ')
}

function getGranularKeys(category: ProductCategory): string[] {
  return getCompletenessOptionsForCategory(category)
    .map((o) => o.value)
    .filter((v) => v !== 'UNIT_ONLY' && v !== 'FULLSET')
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

  if (categoryRequiresColor(input.category) && !input.color) {
    return 'Warna wajib diisi'
  }
  if (!input.storage) return 'Storage wajib diisi'

  if (categoryRequiresRam(input.category) && !input.ram) {
    return 'RAM wajib diisi'
  }

  if (categoryRequiresProcessor(input.category) && !input.processor) {
    return 'Processor wajib diisi'
  }

  return validateCompleteness(input.completeness, input.category)
}

export function specsToDb(input: ProductSpecsInput) {
  const profile = categorySpecProfile(input.category)
  return {
    color: profile === 'mobile' ? input.color : '',
    ram:
      input.category === 'AKSESORIS' || input.category === 'SOFTWARE' ? '' : input.ram,
    processor: profile === 'computer' ? input.processor : '',
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
  const rows: ProductSpecDisplayRow[] = []

  if (categoryRequiresColor(category) && data.color) {
    rows.push({ label: 'Warna', value: data.color })
  }
  if (data.storage) rows.push({ label: 'Storage', value: data.storage })
  if (data.ram) rows.push({ label: 'RAM', value: data.ram })
  if (categoryRequiresProcessor(category) && data.processor) {
    rows.push({ label: 'Processor', value: data.processor })
  }
  if (data.warranty) rows.push({ label: 'Garansi', value: warrantyLabel(data.warranty) })

  return rows
}

/* ============================================================
   BENCHMARK FIELDS — parsing dari FormData (kondisi + 3uTools)
   ============================================================ */

const VALID_GRADES: ConditionGrade[] = ['BNIB', 'LIKE_NEW', 'MULUS', 'NORMAL', 'MINUS']

function parseIntField(raw: FormDataEntryValue | null, min: number, max: number): number | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, n))
}

function parseBoolField(raw: FormDataEntryValue | null): boolean | null {
  if (raw === 'true') return true
  if (raw === 'false') return false
  return null
}

export function parseBenchmarkFieldsFromForm(
  form: FormData,
  category: ProductCategory,
): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  const inferredDeviceType = deviceTypeForCategory(category)
  if (inferredDeviceType) {
    data.deviceType = inferredDeviceType
  } else if (
    category === 'MACBOOK' ||
    category === 'LAPTOP' ||
    category === 'PC' ||
    category === 'AKSESORIS' ||
    category === 'SOFTWARE' ||
    category === 'LAINNYA'
  ) {
    data.deviceType = null
  }

  const grade = form.get('conditionGrade')
  if (typeof grade === 'string' && VALID_GRADES.includes(grade as ConditionGrade)) {
    data.conditionGrade = grade as ConditionGrade
  }
  const percent = parseIntField(form.get('conditionPercent'), 0, 100)
  if (percent != null) data.conditionPercent = percent
  const minus = form.get('minusNotes')
  if (typeof minus === 'string') data.minusNotes = minus.trim() || null

  const battery = parseIntField(form.get('batteryHealth'), 0, 100)
  if (battery != null) data.batteryHealth = battery
  const cycle = parseIntField(form.get('batteryCycle'), 0, 100000)
  if (cycle != null) data.batteryCycle = cycle
  const allOriginal = parseBoolField(form.get('isAllOriginal'))
  if (allOriginal != null) data.isAllOriginal = allOriginal
  const trueTone = parseBoolField(form.get('trueToneActive'))
  if (trueTone != null) data.trueToneActive = trueTone
  const faceId = parseBoolField(form.get('faceIdWorks'))
  if (faceId != null) data.faceIdWorks = faceId

  const replaced = form.get('replacedParts')
  if (typeof replaced === 'string') {
    data.replacedParts = replaced
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  return data
}
