'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_PAGE_SIZE,
  clampPage,
  getTotalPages,
  paginateSlice,
  type PageSizeOption,
} from '@/lib/pagination'

/**
 * Pagination client-side untuk list yang sudah di-fetch / di-filter di memori.
 * Reset ke halaman 1 saat `resetDeps` atau `pageSize` berubah.
 */
export function useClientPagination<T>(items: T[], resetDeps: unknown[] = []) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPage(1)
  }, [pageSize, ...resetDeps])

  const totalItems = items.length
  const totalPages = getTotalPages(totalItems, pageSize)
  const safePage = clampPage(page, totalPages)

  const paginatedItems = useMemo(
    () => paginateSlice(items, safePage, pageSize),
    [items, safePage, pageSize],
  )

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  const setPageSizeAndReset = (size: PageSizeOption) => {
    setPageSize(size)
    setPage(1)
  }

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize: setPageSizeAndReset,
    paginatedItems,
    totalItems,
    totalPages,
  }
}
