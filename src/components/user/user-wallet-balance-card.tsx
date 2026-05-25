'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useWallet } from '@/contexts/wallet-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WalletTopupModal } from '@/components/wallet/wallet-topup-modal'
import { Plus, Wallet } from '@/lib/icons'
import { formatIdr } from '@/lib/wallet-transactions'
import { cn } from '@/lib/utils'

type UserWalletBalanceCardProps = {
  className?: string
  compact?: boolean
}

export function UserWalletBalanceCard({ className, compact = false }: UserWalletBalanceCardProps) {
  const { wallet, isLoading, refreshWallet } = useWallet()
  const [depositOpen, setDepositOpen] = useState(false)
  const balance = wallet ? parseFloat(wallet.balance) : 0

  return (
    <>
    <Card
      className={cn(
        'border-primary-200/50 bg-gradient-to-br from-primary-50 via-white to-primary-50/30',
        className,
      )}
    >
      <CardContent className={cn('p-5', compact && 'p-4 sm:p-5')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary-700">
              Sisa saldo
            </p>
            <p
              className={cn(
                'mt-1 font-bold tabular-nums text-primary-900',
                compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl',
              )}
            >
              {isLoading ? '…' : formatIdr(balance)}
            </p>
            <p className="mt-1 text-xs text-primary-600/90">
              {wallet
                ? `Terakhir update: ${new Date(wallet.updatedAt).toLocaleDateString('id-ID')}`
                : 'Wallet siap digunakan'}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100/80 sm:h-12 sm:w-12">
            <Wallet className="h-5 w-5 text-primary-700 sm:h-6 sm:w-6" />
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          className="mt-4 w-full"
          onClick={() => setDepositOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">Deposit</span>
        </Button>
      </CardContent>
    </Card>

    <AnimatePresence>
      {depositOpen && (
        <WalletTopupModal
          onClose={() => setDepositOpen(false)}
          onSuccess={() => void refreshWallet()}
        />
      )}
    </AnimatePresence>
    </>
  )
}
