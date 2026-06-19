import type { ConditionGrade, ProductCategory } from '@prisma/client'
import { categorySupportsBenchmark, categorySupportsThreeUtools } from '@/lib/product-category-config'
import { CONDITION_GRADE_OPTIONS } from '@/components/teknisi/product-benchmark-fields'
import { formatReplacedPartsDisplay } from '@/lib/replaced-parts'

export type ProductBenchmarkDisplay = {
  conditionGrade: ConditionGrade | null
  conditionPercent: number | null
  minusNotes: string | null
  batteryHealth: number | null
  batteryCycle: number | null
  isAllOriginal: boolean | null
  replacedParts: string[]
  trueToneActive: boolean | null
  faceIdWorks: boolean | null
  verified3uTools: boolean
}

export function conditionGradeLabel(grade: ConditionGrade | null): string | null {
  if (!grade) return null
  return CONDITION_GRADE_OPTIONS.find((o) => o.value === grade)?.label ?? grade
}

export function fmtBoolDisplay(
  value: boolean | null,
  yes: string,
  no: string,
): string | null {
  if (value === null) return null
  return value ? yes : no
}

export function scoreTone(value: number | null, good = 80, warn = 60): 'good' | 'warn' | 'bad' | 'neutral' {
  if (value == null) return 'neutral'
  if (value >= good) return 'good'
  if (value >= warn) return 'warn'
  return 'bad'
}

export function boolTone(value: boolean | null, positive = true): 'good' | 'bad' | 'neutral' {
  if (value === null) return 'neutral'
  if (positive) return value ? 'good' : 'bad'
  return value ? 'bad' : 'good'
}

export function cycleCountTone(cycles: number | null): 'good' | 'warn' | 'bad' | 'neutral' {
  if (cycles == null) return 'neutral'
  if (cycles <= 300) return 'good'
  if (cycles <= 500) return 'warn'
  return 'bad'
}

export function hasBenchmarkDisplayData(
  category: ProductCategory,
  data: ProductBenchmarkDisplay,
): boolean {
  if (!categorySupportsBenchmark(category)) return false
  return (
    data.conditionGrade != null ||
    data.conditionPercent != null ||
    Boolean(data.minusNotes?.trim()) ||
    data.batteryHealth != null ||
    data.batteryCycle != null ||
    data.isAllOriginal != null ||
    data.replacedParts.length > 0 ||
    data.trueToneActive != null ||
    data.faceIdWorks != null
  )
}

export function showThreeUtoolsBenchmark(category: ProductCategory): boolean {
  return categorySupportsThreeUtools(category)
}

export function replacedPartsDisplay(parts: string[]): string {
  return formatReplacedPartsDisplay(parts)
}
