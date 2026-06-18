import type { Product } from '@prisma/client'
import { BENCHMARKABLE_CATEGORIES } from '@/lib/product-category-config'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'
import { getPrimaryProductImageUrl, parseProductImagesField } from '@/lib/product-images'
import { parseCompletenessJson } from '@/lib/product-specs'
import type { BenchmarkProductInput } from '@/lib/product-benchmark'

export { BENCHMARKABLE_CATEGORIES }

export function isBenchmarkable(category: string): boolean {
  return (BENCHMARKABLE_CATEGORIES as readonly string[]).includes(category)
}

/** Map Product (Prisma) → input untuk engine benchmark */
export function toBenchmarkInput(p: Product): BenchmarkProductInput {
  const images = parseProductImagesField(p)
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    deviceType: p.deviceType,
    price: Number(p.price),
    image: resolveDisplayImageUrl(getPrimaryProductImageUrl(images, p.image)),
    ram: p.ram,
    storage: p.storage,
    warranty: p.warranty,
    completeness: parseCompletenessJson(p.completeness, p.category),
    conditionGrade: p.conditionGrade,
    conditionPercent: p.conditionPercent,
    minusNotes: p.minusNotes,
    batteryHealth: p.batteryHealth,
    batteryCycle: p.batteryCycle,
    isAllOriginal: p.isAllOriginal,
    replacedParts: p.replacedParts,
    trueToneActive: p.trueToneActive,
    faceIdWorks: p.faceIdWorks,
    verified3uTools: p.verified3uTools,
  }
}
