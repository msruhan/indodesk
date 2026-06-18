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
import {
  CART_STORAGE_KEY,
  type CartItem,
  type ProductForCart,
  productToCartItem,
} from '@/lib/cart'
import type { ProductCouponConfig } from '@/lib/product-coupon'

export type CartProductSync = {
  id: string
  price: number
  coupon: ProductCouponConfig | null
  available: boolean
}

interface CartContextType {
  items: CartItem[]
  itemCount: number
  hydrated: boolean
  addItem: (product: ProductForCart, quantity?: number) => void
  updateQuantity: (id: string, delta: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  syncProducts: (products: CartProductSync[]) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[]
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const addItem = useCallback((product: ProductForCart, quantity = 1) => {
    const incoming = productToCartItem(product, quantity)
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === incoming.id && i.type === incoming.type)
      if (idx === -1) return [...prev, incoming]
      return prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              quantity: item.quantity + quantity,
              price: incoming.price,
              coupon: incoming.coupon ?? item.coupon ?? null,
            }
          : item,
      )
    })
  }, [])

  const syncProducts = useCallback((products: CartProductSync[]) => {
    if (products.length === 0) return
    const byId = new Map(products.map((p) => [p.id, p]))
    setItems((prev) =>
      prev.map((item) => {
        const sync = byId.get(item.id)
        if (!sync || item.type === 'topup') return item
        return {
          ...item,
          price: sync.available ? sync.price : item.price,
          coupon: sync.coupon,
        }
      }),
    )
  }, [])

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item,
      ),
    )
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      itemCount,
      hydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      syncProducts,
    }),
    [items, itemCount, hydrated, addItem, updateQuantity, removeItem, clearCart, syncProducts],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
