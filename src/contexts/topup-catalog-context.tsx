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
import type { TopupCategory, TopupDenomination, TopupProduct } from '@/data/topup-types'
import { topupCategories as defaultCategories } from '@/data/mock-topup'

type TopupCatalogContextValue = {
  loading: boolean
  error: string | null
  categories: TopupCategory[]
  products: TopupProduct[]
  denominations: TopupDenomination[]
  reload: () => Promise<void>
  findProduct: (slug: string) => TopupProduct | undefined
  denominationsOf: (slug: string) => TopupDenomination[]
  findDenomination: (sku: string) => TopupDenomination | undefined
  flashSaleDenominations: TopupDenomination[]
  popularProducts: TopupProduct[]
}

const TopupCatalogContext = createContext<TopupCatalogContextValue | undefined>(undefined)

export function TopupCatalogProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<TopupCategory[]>(defaultCategories)
  const [products, setProducts] = useState<TopupProduct[]>([])
  const [denominations, setDenominations] = useState<TopupDenomination[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/topup/catalog')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal memuat katalog topup')
      setCategories(json.data.categories ?? defaultCategories)
      setProducts(json.data.products ?? [])
      setDenominations(json.data.denominations ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat katalog topup')
      setProducts([])
      setDenominations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo<TopupCatalogContextValue>(() => {
    const findProduct = (slug: string) => products.find((p) => p.slug === slug)
    const denominationsOf = (slug: string) =>
      denominations.filter((d) => d.productSlug === slug)
    const findDenomination = (sku: string) => denominations.find((d) => d.sku === sku)
    const flashSaleDenominations = denominations.filter((d) => d.flashSale)
    const popularProducts = products.filter((p) => p.isHot)

    return {
      loading,
      error,
      categories,
      products,
      denominations,
      reload: load,
      findProduct,
      denominationsOf,
      findDenomination,
      flashSaleDenominations,
      popularProducts,
    }
  }, [loading, error, categories, products, denominations, load])

  return <TopupCatalogContext.Provider value={value}>{children}</TopupCatalogContext.Provider>
}

export function useTopupCatalog() {
  const ctx = useContext(TopupCatalogContext)
  if (!ctx) {
    throw new Error('useTopupCatalog must be used within TopupCatalogProvider')
  }
  return ctx
}
