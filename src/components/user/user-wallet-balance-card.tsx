'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useWallet } from '@/contexts/wallet-context'
import { ArrowRight, Wallet } from '@/lib/icons'
import { formatIdr } from '@/lib/wallet-transactions'
import { cn } from '@/lib/utils'

type UserWalletBalanceCardProps = {
  className?: string
  compact?: boolean
  /** Saldo dari server dashboard (opsional, fallback ke useWallet). */
  walletBalance?: number
}

export function UserWalletBalanceCard({
  className,
  compact = false,
  walletBalance,
}: UserWalletBalanceCardProps) {
  const { wallet, isLoading } = useWallet()
  const balance =
    walletBalance ??
    (wallet ? parseFloat(wallet.balance) : 0)
  const balanceLabel = isLoading && walletBalance == null ? '…' : formatIdr(balance)

  return (
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
              Saldo Bantoo
            </p>
            <p
              className={cn(
                'mt-1 font-bold tracking-tight tabular-nums text-primary-900',
                compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl',
              )}
            >
              {balanceLabel}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-primary-700/90">
              Saldo dari refund atau pembatalan pesanan. Checkout tetap bayar langsung via QRIS
              atau Virtual Account — tidak perlu top up.
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100/80 sm:h-12 sm:w-12">
            <Wallet className="h-5 w-5 text-primary-700 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="mt-4">
          <Link href="/user/riwayat">
            <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
              Kelola saldo & riwayat
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
