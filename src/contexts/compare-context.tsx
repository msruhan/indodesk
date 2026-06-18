'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { BENCHMARKABLE_CATEGORIES } from '@/lib/product-category-config'

/** Produk minimal yang disimpan untuk perbandingan */
export type CompareItem = {
  id: string
  name: string
  image: string | null
  price: number
  category: string // ProductCategory value
}

type CompareContextValue = {
  items: CompareItem[]
  /** Tambah produk ke perbandingan. Return pesan error jika gagal. */
  add: (item: CompareItem) => { ok: boolean; message?: string }
  remove: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
  isFull: boolean
  /** Kategori yang sedang dikunci (item pertama menentukan) */
  lockedCategory: string | null
}

const CompareContext = createContext<CompareContextValue | null>(null)

const STORAGE_KEY = 'indoteknizi:compare'
const MAX_ITEMS = 2

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([])

  // Hydrate dari localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CompareItem[]
        if (Array.isArray(parsed)) setItems(parsed.slice(0, MAX_ITEMS))
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items])

  const lockedCategory = items[0]?.category ?? null

  const add = useCallback<CompareContextValue['add']>(
    (item) => {
      let result: { ok: boolean; message?: string } = { ok: true }
      setItems((prev) => {
        if (prev.some((p) => p.id === item.id)) {
          result = { ok: false, message: 'Produk sudah ada di perbandingan' }
          return prev
        }
        if (prev.length >= MAX_ITEMS) {
          result = { ok: false, message: 'Maksimal 2 produk untuk dibandingkan' }
          return prev
        }
        if (prev.length > 0 && prev[0]!.category !== item.category) {
          result = {
            ok: false,
            message: 'Hanya bisa membandingkan produk dengan kategori yang sama',
          }
          return prev
        }
        return [...prev, item]
      })
      return result
    },
    [],
  )

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const has = useCallback((id: string) => items.some((p) => p.id === id), [items])

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      add,
      remove,
      clear,
      has,
      isFull: items.length >= MAX_ITEMS,
      lockedCategory,
    }),
    [items, add, remove, clear, has, lockedCategory],
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within CompareProvider')
  return ctx
}

/** Kategori yang mendukung benchmark / perbandingan */
export const COMPARABLE_CATEGORIES = BENCHMARKABLE_CATEGORIES

export function isComparable(category: string): boolean {
  return (BENCHMARKABLE_CATEGORIES as readonly string[]).includes(category)
}
