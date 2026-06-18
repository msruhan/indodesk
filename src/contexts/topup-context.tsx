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
import type { TopupOrderDraft } from '@/data/topup-types'

const STORAGE_KEY = 'indoteknizi.topup-draft.v1'
const HISTORY_KEY = 'indoteknizi.topup-history.v1'

const emptyDraft: TopupOrderDraft = {
  productSlug: '',
  denominationSku: null,
  accountId: '',
  serverId: '',
  paymentMethodId: null,
  promoCode: '',
  email: '',
  whatsapp: '',
}

interface OrderHistoryEntry {
  orderCode: string
  pollToken?: string
  productSlug: string
  productName: string
  denominationLabel: string
  total: number
  accountId: string
  status: 'pending-payment' | 'paid' | 'processing' | 'fulfilling' | 'completed' | 'failed'
  createdAt: string
}

interface TopupContextValue {
  draft: TopupOrderDraft
  setDraft: (
    updater: TopupOrderDraft | ((prev: TopupOrderDraft) => TopupOrderDraft),
  ) => void
  /** Reset draft to defaults but keep the productSlug (handy for "Top up lagi") */
  resetDraft: (productSlug?: string) => void
  /** Persist a freshly-submitted order. Used by /order/[id] for guest lookups. */
  saveOrder: (entry: OrderHistoryEntry) => void
  /** Read an order back. Returns undefined if not found. */
  getOrder: (orderCode: string) => OrderHistoryEntry | undefined
  /** Most-recent first */
  history: OrderHistoryEntry[]
}

const TopupContext = createContext<TopupContextValue | undefined>(undefined)

export function TopupProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<TopupOrderDraft>(emptyDraft)
  const [history, setHistory] = useState<OrderHistoryEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const rawDraft = localStorage.getItem(STORAGE_KEY)
      if (rawDraft) setDraftState({ ...emptyDraft, ...JSON.parse(rawDraft) })
      const rawHistory = localStorage.getItem(HISTORY_KEY)
      if (rawHistory) setHistory(JSON.parse(rawHistory))
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true)
  }, [])

  // Persist draft whenever it changes (after hydration).
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch {
      // quota / disabled storage — non-fatal
    }
  }, [draft, hydrated])

  const setDraft: TopupContextValue['setDraft'] = useCallback((updater) => {
    setDraftState((prev) =>
      typeof updater === 'function' ? (updater as (p: TopupOrderDraft) => TopupOrderDraft)(prev) : updater,
    )
  }, [])

  const resetDraft = useCallback((productSlug?: string) => {
    setDraftState({ ...emptyDraft, productSlug: productSlug ?? '' })
  }, [])

  const saveOrder = useCallback((entry: OrderHistoryEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev.filter((e) => e.orderCode !== entry.orderCode)].slice(0, 25)
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const getOrder = useCallback(
    (orderCode: string) => history.find((e) => e.orderCode === orderCode.toUpperCase()),
    [history],
  )

  const value = useMemo(
    () => ({ draft, setDraft, resetDraft, saveOrder, getOrder, history }),
    [draft, setDraft, resetDraft, saveOrder, getOrder, history],
  )

  return <TopupContext.Provider value={value}>{children}</TopupContext.Provider>
}

export function useTopup() {
  const ctx = useContext(TopupContext)
  if (!ctx) throw new Error('useTopup must be used within TopupProvider')
  return ctx
}

export type { OrderHistoryEntry }
