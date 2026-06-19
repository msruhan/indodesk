'use client'

import Link from 'next/link'
import { useWallet } from '@/contexts/wallet-context'
import { saldoPathForRole, showProfileSaldoForRole } from '@/lib/role-routes'
import { History, Wallet } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { UserRole } from '@prisma/client'

function formatWalletBalance(balance: string | number): string {
  const amount = typeof balance === 'string' ? parseFloat(balance) : balance
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

type ProfileMenuSaldoItemProps = {
  role: UserRole
  onNavigate?: () => void
  className?: string
  size?: 'sm' | 'md'
}

export function ProfileMenuSaldoItem({
  role,
  onNavigate,
  className,
  size = 'md',
}: ProfileMenuSaldoItemProps) {
  const { wallet, isLoading } = useWallet()

  if (!showProfileSaldoForRole(role)) return null

  if (role === 'USER') {
    return (
      <Link
        href={saldoPathForRole(role)}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2 rounded-xl font-medium text-surface-700 transition-colors hover:bg-surface-100/80 hover:text-ink',
          size === 'sm' ? 'px-2.5 py-2 text-xs' : 'mt-1 px-3.5 py-2 text-[13px]',
          className,
        )}
      >
        <History className={size === 'sm' ? 'h-3.5 w-3.5 text-surface-500' : 'h-4 w-4 text-surface-500'} />
        Riwayat transaksi
      </Link>
    )
  }

  const balanceText = isLoading ? '…' : formatWalletBalance(wallet?.balance ?? '0')

  return (
    <Link
      href={saldoPathForRole(role)}
      onClick={onNavigate}
      className={cn(
        'flex items-center justify-between gap-2 rounded-xl font-medium text-surface-700 transition-colors hover:bg-surface-100/80 hover:text-ink',
        size === 'sm' ? 'px-2.5 py-2 text-xs' : 'mt-1 px-3.5 py-2 text-[13px]',
        className,
      )}
    >
      <span className="flex items-center gap-2">
        <Wallet className={size === 'sm' ? 'h-3.5 w-3.5 text-surface-500' : 'h-4 w-4 text-surface-500'} />
        Saldo
      </span>
      <span className="truncate font-semibold tabular-nums text-primary-700">{balanceText}</span>
    </Link>
  )
}
