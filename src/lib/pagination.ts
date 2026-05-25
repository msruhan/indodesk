/** Opsi ukuran halaman standar di seluruh dashboard. */
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

export const DEFAULT_PAGE_SIZE: PageSizeOption = 20

export const MAX_PAGE_SIZE = 100

export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0) return 1
  return Math.max(1, Math.ceil(totalItems / pageSize))
}

export function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(1, page), totalPages)
}

export function paginateSlice<T>(items: T[], page: number, pageSize: number): T[] {
  const totalPages = getTotalPages(items.length, pageSize)
  const safePage = clampPage(page, totalPages)
  const start = (safePage - 1) * pageSize
  return items.slice(start, start + pageSize)
}

export function pageRangeLabel(page: number, pageSize: number, totalItems: number) {
  if (totalItems === 0) return { start: 0, end: 0 }
  const safePage = clampPage(page, getTotalPages(totalItems, pageSize))
  const start = (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, totalItems)
  return { start, end }
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = getTotalPages(total, pageSize)
  return {
    page: clampPage(page, totalPages),
    pageSize,
    total,
    totalPages,
  }
}

/** Parse `page` & `pageSize` (atau `limit` legacy) dari query string API. */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults?: { page?: number; pageSize?: number },
): { page: number; pageSize: number; skip: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? String(defaults?.page ?? 1), 10) || 1)
  const rawSize =
    searchParams.get('pageSize') ??
    searchParams.get('limit') ??
    String(defaults?.pageSize ?? DEFAULT_PAGE_SIZE)
  let pageSize = parseInt(rawSize, 10) || DEFAULT_PAGE_SIZE
  if (!PAGE_SIZE_OPTIONS.includes(pageSize as PageSizeOption)) {
    pageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE)
  }
  const skip = (page - 1) * pageSize
  return { page, pageSize, skip }
}
