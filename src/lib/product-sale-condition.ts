import type { ProductCategory, ProductSaleCondition } from '@prisma/client'
import type { BenchmarkFormState } from '@/components/teknisi/product-benchmark-fields'
import { categorySupportsBenchmark } from '@/lib/product-category-config'

export const PRODUCT_SALE_CONDITION_OPTIONS: {
  value: ProductSaleCondition
  label: string
}[] = [
  { value: 'NEW', label: 'Baru' },
  { value: 'USED', label: 'Bekas' },
]

export function parseSaleConditionFromForm(form: FormData): ProductSaleCondition {
  return form.get('saleCondition') === 'NEW' ? 'NEW' : 'USED'
}

export function newProductBenchmarkFormState(): BenchmarkFormState {
  return {
    conditionGrade: 'BNIB',
    conditionPercent: '100',
    minusNotes: '',
    batteryHealth: '100',
    batteryCycle: '0',
    isAllOriginal: true,
    replacedParts: [],
    trueToneActive: true,
    faceIdWorks: true,
  }
}

/** Nilai benchmark sempurna untuk produk baru (tanpa screenshot 3uTools). */
export function newProductBenchmarkDbValues(
  category: ProductCategory,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    saleCondition: 'NEW',
    conditionGrade: 'BNIB',
    conditionPercent: 100,
    minusNotes: null,
    isAllOriginal: true,
    replacedParts: [],
    verified3uTools: false,
  }

  if (category === 'IPHONE' || category === 'IPAD') {
    return {
      ...base,
      batteryHealth: 100,
      batteryCycle: 0,
      trueToneActive: true,
      faceIdWorks: true,
    }
  }

  if (category === 'ANDROID') {
    return {
      ...base,
      batteryHealth: 100,
      batteryCycle: null,
      trueToneActive: null,
      faceIdWorks: null,
    }
  }

  return {
    ...base,
    batteryHealth: null,
    batteryCycle: null,
    trueToneActive: null,
    faceIdWorks: null,
  }
}

export function isNewProductSaleCondition(
  saleCondition: ProductSaleCondition | null | undefined,
): boolean {
  return saleCondition === 'NEW'
}

export function shouldSkipUsedProductBenchmarkInput(
  saleCondition: ProductSaleCondition,
  category: ProductCategory,
): boolean {
  return saleCondition === 'NEW' && categorySupportsBenchmark(category)
}
