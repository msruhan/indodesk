'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { handleStaleSessionResponse } from '@/lib/handle-stale-session'

export interface WalletData {
  id: string
  userId: string
  balance: string
  createdAt: string
  updatedAt: string
}

interface WalletContextType {
  wallet: WalletData | null
  isLoading: boolean
  error: string | null
  refreshWallet: () => Promise<void>
  topup: (amount: number, paymentMethod: 'GATEWAY' | 'PAYPAL' | 'TRANSFER', details?: Record<string, string>) => Promise<{ success: boolean; error?: string }>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshWallet = useCallback(async () => {
    if (!user) {
      setWallet(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/wallet')
      const data = await res.json()

      if (await handleStaleSessionResponse(res, data)) return

      if (data.success) {
        setWallet(data.data)
      } else {
        setError(data.error || 'Gagal mengambil data wallet')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const topup = useCallback(
    async (
      amount: number,
      paymentMethod: 'GATEWAY' | 'PAYPAL' | 'TRANSFER',
      details?: Record<string, string>,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/wallet/topup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            paymentMethod,
            ...details,
          }),
        })

        const data = await res.json()
        if (data.success) {
          await refreshWallet()
          return { success: true }
        }
        return { success: false, error: data.error }
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Terjadi kesalahan' }
      }
    },
    [refreshWallet],
  )

  useEffect(() => {
    refreshWallet()
  }, [refreshWallet])

  return (
    <WalletContext.Provider value={{ wallet, isLoading, error, refreshWallet, topup }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}
