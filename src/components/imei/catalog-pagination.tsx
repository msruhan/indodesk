'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from '@/lib/icons'
import type { CatalogViewMode } from '@/components/imei/catalog-view-toggle'

export const CATALOG_PAGE_SIZE: Record<CatalogViewMode, number> = {
  grid: 18,
  list: 20,
}

type CatalogPaginationProps = {
  page: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  variant?: 'primary' | 'amber'
  className?: string
}

export function getCatalogPageCount(totalItems: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalItems / pageSize) || 1)
}

export function paginateCatalogItems<T>(items: T[], page: number, pageSize: number): T[] {
  const totalPages = getCatalogPageCount(items.length, pageSize)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return items.slice(start, start + pageSize)
}

export function catalogPageRange(page: number, pageSize: number, totalItems: number) {
  if (totalItems === 0) return { start: 0, end: 0 }
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  return { start, end }
}

export function CatalogPagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  variant = 'primary',
  className,
}: CatalogPaginationProps) {
  const totalPages = getCatalogPageCount(totalItems, pageSize)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const { start, end } = catalogPageRange(safePage, pageSize, totalItems)

  if (totalItems <= pageSize) return null

  const activeBtn =
    variant === 'amber'
      ? 'bg-amber-600 text-white hover:bg-amber-700'
      : 'bg-primary-600 text-white hover:bg-primary-700'

  const pageWindow = 5
  let pageStart = Math.max(1, safePage - Math.floor(pageWindow / 2))
  const pageEnd = Math.min(totalPages, pageStart + pageWindow - 1)
  pageStart = Math.max(1, pageEnd - pageWindow + 1)
  const pages: number[] = []
  for (let p = pageStart; p <= pageEnd; p += 1) pages.push(p)

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 border-t border-surface-200/60 pt-4 sm:flex-row sm:justify-between',
        className,
      )}
    >
      <p className="text-xs text-surface-500">
        Menampilkan{' '}
        <span className="font-medium text-ink">
          {start}–{end}
        </span>{' '}
        dari <span className="font-medium text-ink">{totalItems}</span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-lg border border-surface-200/70 bg-white px-2.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:pointer-events-none disabled:opacity-40',
          )}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        {pageStart > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-surface-200/70 bg-white px-2 text-xs font-medium text-surface-700 hover:bg-surface-50"
            >
              1
            </button>
            {pageStart > 2 && <span className="px-1 text-xs text-surface-400">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors',
              p === safePage
                ? activeBtn
                : 'border border-surface-200/70 bg-white text-surface-700 hover:bg-surface-50',
            )}
            aria-current={p === safePage ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        {pageEnd < totalPages && (
          <>
            {pageEnd < totalPages - 1 && <span className="px-1 text-xs text-surface-400">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-surface-200/70 bg-white px-2 text-xs font-medium text-surface-700 hover:bg-surface-50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-lg border border-surface-200/70 bg-white px-2.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:pointer-events-none disabled:opacity-40',
          )}
          aria-label="Halaman berikutnya"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
