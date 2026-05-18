'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@/contexts/wallet-context'
import { useAuth } from '@/contexts/auth-context'
import { Wallet, Plus, TrendingUp, X } from '@/lib/icons'
import { cn } from '@/lib/utils'

export function WalletBalanceButton() {
  const { wallet, isLoading } = useWallet()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user || user.role === 'ADMIN') return null

  const balance = wallet ? parseFloat(wallet.balance) : 0
  const formattedBalance = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(balance)

  return (
    <div className="relative hidden md:block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-full border border-surface-200/80 bg-white/60 px-3 text-sm font-medium backdrop-blur-md transition-all',
          isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700',
        )}
        disabled={isLoading}
      >
        <Wallet className="h-4 w-4" />
        <span>{isLoading ? 'Loading...' : formattedBalance}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-surface-200/70 bg-white p-4 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-surface-500">Saldo Anda</p>
                  <p className="mt-1 text-2xl font-bold text-ink">{formattedBalance}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <Link
                  href={user.role === 'TEKNISI' ? '/teknisi/saldo' : '/user/saldo'}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100"
                >
                  <Plus className="h-4 w-4" />
                  Topup Saldo
                </Link>
                <Link
                  href={user.role === 'TEKNISI' ? '/teknisi/saldo' : '/user/saldo'}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100"
                >
                  <TrendingUp className="h-4 w-4" />
                  Riwayat Transaksi
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
