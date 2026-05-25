'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from '@/lib/icons'
import { pageRangeLabel, type PageSizeOption } from '@/lib/pagination'
import { PageSizeSelect } from '@/components/ui/page-size-select'

export type DataPaginationProps = {
  page: number
  pageSize: PageSizeOption
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSizeOption) => void
  /** Sembunyikan jika totalItems === 0 */
  hideWhenEmpty?: boolean
  className?: string
}

export function DataPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  hideWhenEmpty = true,
  className,
}: DataPaginationProps) {
  if (hideWhenEmpty && totalItems === 0) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const { start, end } = pageRangeLabel(safePage, pageSize, totalItems)

  const pageWindow = 5
  let pageStart = Math.max(1, safePage - Math.floor(pageWindow / 2))
  const pageEnd = Math.min(totalPages, pageStart + pageWindow - 1)
  pageStart = Math.max(1, pageEnd - pageWindow + 1)
  const pages: number[] = []
  for (let p = pageStart; p <= pageEnd; p += 1) pages.push(p)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-surface-200/60 pt-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500">
        <p>
          {totalItems === 0 ? (
            'Tidak ada data'
          ) : (
            <>
              Menampilkan{' '}
              <span className="font-medium text-ink">
                {start}–{end}
              </span>{' '}
              dari <span className="font-medium text-ink">{totalItems}</span>
            </>
          )}
        </p>
        <div className="inline-flex items-center gap-1.5">
          <span className="text-surface-500">Per halaman</span>
          <PageSizeSelect value={pageSize} onChange={onPageSizeChange} />
        </div>
      </div>

      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-end">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-surface-200/70 bg-white px-2.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:pointer-events-none disabled:opacity-40"
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
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
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
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-surface-200/70 bg-white px-2.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Halaman berikutnya"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
