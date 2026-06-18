'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useWallet } from '@/contexts/wallet-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WalletTopupModal } from '@/components/wallet/wallet-topup-modal'
import { WalletWithdrawModal } from '@/components/wallet/wallet-withdraw-modal'
import { Download, Plus, Wallet } from '@/lib/icons'
import { formatIdr } from '@/lib/wallet-transactions'
import { cn } from '@/lib/utils'

type UserWalletBalanceCardProps = {
  className?: string
  compact?: boolean
}

export function UserWalletBalanceCard({ className, compact = false }: UserWalletBalanceCardProps) {
  const { wallet, isLoading, refreshWallet } = useWallet()
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const balance = wallet ? parseFloat(wallet.balance) : 0
  const heldBalance = wallet?.heldBalance ? parseFloat(wallet.heldBalance) : 0
  const totalBalance = wallet?.totalBalance
    ? parseFloat(wallet.totalBalance)
    : balance + heldBalance

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
            {!isLoading && heldBalance > 0 && (
              <div className="mt-2 space-y-0.5 text-xs text-primary-700/90">
                <p>
                  Ditahan (escrow):{' '}
                  <span className="font-semibold tabular-nums">{formatIdr(heldBalance)}</span>
                </p>
                <p>
                  Total:{' '}
                  <span className="font-semibold tabular-nums">{formatIdr(totalBalance)}</span>
                </p>
              </div>
            )}
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

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => setDepositOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">Deposit</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setWithdrawOpen(true)}
            disabled={isLoading || balance <= 0}
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">Tarik</span>
          </Button>
        </div>
      </CardContent>
    </Card>

    <AnimatePresence>
      {depositOpen && (
        <WalletTopupModal
          onClose={() => setDepositOpen(false)}
          onSuccess={() => void refreshWallet()}
        />
      )}
      {withdrawOpen && (
        <WalletWithdrawModal
          onClose={() => setWithdrawOpen(false)}
          onSuccess={() => void refreshWallet()}
        />
      )}
    </AnimatePresence>
    </>
  )
}
