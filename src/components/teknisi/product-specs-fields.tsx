'use client'

import type { ProductCategory } from '@prisma/client'
import { ProductWarranty } from '@prisma/client'
import { cn } from '@/lib/utils'
import {
  categoryRamOptional,
  categoryRequiresColor,
  categoryRequiresProcessor,
  categoryRequiresRam,
  categoryRequiresSpecs,
  categorySpecProfile,
} from '@/lib/product-category-config'
import {
  PRODUCT_WARRANTY_OPTIONS,
  getCompletenessOptionsForCategory,
  toggleCompletenessSelection,
  type ProductCompletenessKey,
  type ProductSpecsFormState,
} from '@/lib/product-specs'
import { Input } from '@/components/ui/input'

export type { ProductSpecsFormState }
export { emptyProductSpecsForm } from '@/lib/product-specs'

type ProductSpecsFieldsProps = {
  category: ProductCategory
  value: ProductSpecsFormState
  onChange: (next: ProductSpecsFormState) => void
}

function CompletenessPicker({
  category,
  value,
  onChange,
}: {
  category: ProductCategory
  value: ProductSpecsFormState
  onChange: (next: ProductSpecsFormState) => void
}) {
  const options = getCompletenessOptionsForCategory(category)
  const granular = options
    .map((o) => o.value)
    .filter((v) => v !== 'UNIT_ONLY' && v !== 'FULLSET')

  const toggleCompleteness = (key: ProductCompletenessKey) => {
    onChange({
      ...value,
      completeness: toggleCompletenessSelection(value.completeness, key, category),
    })
  }

  return (
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm font-medium text-surface-700">
        Kelengkapan <span className="text-rose-500">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value.completeness.includes(opt.value)
          const hasBundle = value.completeness.some(
            (k) => k === 'UNIT_ONLY' || k === 'FULLSET',
          )
          const hasGranular = value.completeness.some((k) =>
            (granular as readonly string[]).includes(k),
          )
          const isBundleOpt = opt.value === 'UNIT_ONLY' || opt.value === 'FULLSET'
          const disabled =
            !selected && ((isBundleOpt && hasGranular) || (!isBundleOpt && hasBundle))
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => toggleCompleteness(opt.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                selected
                  ? 'border-primary-500 bg-primary-50 text-primary-800'
                  : 'border-surface-200 bg-white text-surface-600 hover:border-primary-200',
                disabled && 'cursor-not-allowed opacity-40 hover:border-surface-200',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-surface-500">
        Bisa pilih beberapa item kelengkapan. Unit Only atau Fullset tidak bisa digabung dengan
        pilihan lain.
      </p>
    </div>
  )
}

function WarrantySelect({
  value,
  onChange,
}: {
  value: ProductSpecsFormState
  onChange: (next: ProductSpecsFormState) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-surface-700">
        Garansi <span className="text-rose-500">*</span>
      </label>
      <select
        required
        value={value.warranty}
        onChange={(e) =>
          onChange({ ...value, warranty: e.target.value as ProductWarranty })
        }
        className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink shadow-soft-xs focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50"
      >
        {PRODUCT_WARRANTY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

const COLOR_PLACEHOLDER: Partial<Record<ProductCategory, string>> = {
  IPHONE: 'Contoh: Graphite, Silver, Deep Purple',
  ANDROID: 'Contoh: Hitam, Putih, Biru',
  IPAD: 'Contoh: Space Gray, Silver, Rose Gold',
}

const STORAGE_PLACEHOLDER: Partial<Record<ProductCategory, string>> = {
  IPHONE: 'Contoh: 128GB, 256GB',
  ANDROID: 'Contoh: 128GB, 256GB',
  IPAD: 'Contoh: 64GB, 256GB',
  MACBOOK: 'Contoh: 256GB SSD, 512GB SSD',
  LAPTOP: 'Contoh: 512GB SSD, 1TB SSD',
  PC: 'Contoh: 512GB SSD, 1TB HDD + 256GB SSD',
}

const RAM_PLACEHOLDER: Partial<Record<ProductCategory, string>> = {
  ANDROID: 'Contoh: 6GB, 8GB, 12GB',
  MACBOOK: 'Contoh: 8GB, 16GB unified memory',
  LAPTOP: 'Contoh: 8GB, 16GB',
  PC: 'Contoh: 16GB, 32GB DDR4',
}

const PROCESSOR_PLACEHOLDER: Partial<Record<ProductCategory, string>> = {
  MACBOOK: 'Contoh: Apple M2, M3 Pro',
  LAPTOP: 'Contoh: Intel i7-12700H, Ryzen 7 5800H',
  PC: 'Contoh: Ryzen 5 5600X + RTX 3060',
}

export function ProductSpecsFields({ category, value, onChange }: ProductSpecsFieldsProps) {
  if (!categoryRequiresSpecs(category)) {
    return (
      <p className="md:col-span-2 text-xs text-surface-500">
        Kategori ini tidak memerlukan spesifikasi tambahan.
      </p>
    )
  }

  const profile = categorySpecProfile(category)

  if (profile === 'mobile') {
    return (
      <>
        {categoryRequiresColor(category) && (
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Warna <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              value={value.color}
              onChange={(e) => onChange({ ...value, color: e.target.value })}
              placeholder={COLOR_PLACEHOLDER[category] ?? 'Contoh: Hitam, Silver'}
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Storage <span className="text-rose-500">*</span>
          </label>
          <Input
            required
            value={value.storage}
            onChange={(e) => onChange({ ...value, storage: e.target.value })}
            placeholder={STORAGE_PLACEHOLDER[category] ?? 'Contoh: 256GB'}
          />
        </div>
        {(categoryRequiresRam(category) || categoryRamOptional(category)) && (
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              RAM{' '}
              {categoryRequiresRam(category) ? (
                <span className="text-rose-500">*</span>
              ) : (
                <span className="text-surface-400">(opsional)</span>
              )}
            </label>
            <Input
              required={categoryRequiresRam(category)}
              value={value.ram}
              onChange={(e) => onChange({ ...value, ram: e.target.value })}
              placeholder={RAM_PLACEHOLDER[category] ?? 'Contoh: 8GB'}
            />
          </div>
        )}
        <WarrantySelect value={value} onChange={onChange} />
        <CompletenessPicker category={category} value={value} onChange={onChange} />
      </>
    )
  }

  if (profile === 'computer') {
    return (
      <>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            RAM <span className="text-rose-500">*</span>
          </label>
          <Input
            required
            value={value.ram}
            onChange={(e) => onChange({ ...value, ram: e.target.value })}
            placeholder={RAM_PLACEHOLDER[category] ?? 'Contoh: 16GB'}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Storage <span className="text-rose-500">*</span>
          </label>
          <Input
            required
            value={value.storage}
            onChange={(e) => onChange({ ...value, storage: e.target.value })}
            placeholder={STORAGE_PLACEHOLDER[category] ?? 'Contoh: 512GB SSD'}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            {category === 'PC' ? 'Processor / GPU' : 'Processor'}{' '}
            <span className="text-rose-500">*</span>
          </label>
          <Input
            required
            value={value.processor}
            onChange={(e) => onChange({ ...value, processor: e.target.value })}
            placeholder={PROCESSOR_PLACEHOLDER[category] ?? 'Contoh: Intel i7, Ryzen 5'}
          />
        </div>
        <WarrantySelect value={value} onChange={onChange} />
        <CompletenessPicker category={category} value={value} onChange={onChange} />
      </>
    )
  }

  return null
}
