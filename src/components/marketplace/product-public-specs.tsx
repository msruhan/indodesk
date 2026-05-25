import { Badge } from '@/components/ui/badge'
import {
  categoryRequiresSpecs,
  completenessLabel,
  getProductSpecDisplayRows,
  type ProductCompletenessKey,
} from '@/lib/product-specs'
import type { ProductCategory, ProductWarranty } from '@prisma/client'

type ProductPublicSpecsProps = {
  category: ProductCategory
  color: string
  ram: string
  processor: string
  storage: string
  warranty: ProductWarranty
  completeness: ProductCompletenessKey[]
  className?: string
}

export function ProductPublicSpecs({
  category,
  color,
  ram,
  processor,
  storage,
  warranty,
  completeness,
  className,
}: ProductPublicSpecsProps) {
  if (!categoryRequiresSpecs(category)) return null

  const rows = getProductSpecDisplayRows(category, {
    color,
    ram,
    processor,
    storage,
    warranty,
    completeness,
  })

  if (rows.length === 0 && completeness.length === 0) return null

  return (
    <div className={className}>
      {rows.length > 0 && (
        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-surface-200/70 bg-surface-50/80 px-3 py-2.5"
            >
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-surface-500">
                {row.label}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {completeness.length > 0 && (
        <div
          className={`rounded-xl border border-surface-200/70 bg-surface-50/80 px-3 py-2.5 ${rows.length > 0 ? 'mt-2' : ''}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-surface-500">
            Kelengkapan
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {completeness.map((key) => (
              <Badge key={key} variant="outline" className="text-[10px]">
                {completenessLabel(key)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
