'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, CreditCard, Wallet, Zap } from '@/lib/icons'
import { paymentMethods } from '@/data/mock-topup'
import { formatIDR } from '@/lib/topup-utils'
import { cn } from '@/lib/utils'

interface PaymentMethodListProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

const iconMap = {
  saldo: Wallet,
  qris: Zap,
  ewallet: Wallet,
  va: CreditCard,
  bank: CreditCard,
} as const

export function PaymentMethodList({ selectedId, onSelect }: PaymentMethodListProps) {
  return (
    <div className="space-y-2">
      {paymentMethods.map((m) => {
        const Icon = iconMap[m.kind]
        const selected = selectedId === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => !m.disabled && onSelect(m.id)}
            disabled={m.disabled}
            aria-pressed={selected}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-300 ease-out-expo',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60',
              m.disabled && 'cursor-not-allowed opacity-50',
              selected
                ? 'border-primary-500 bg-primary-50/70 shadow-soft-sm'
                : 'border-surface-200/70 bg-white hover:border-primary-300 hover:shadow-soft-xs',
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                selected
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-surface-100 text-surface-600',
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-ink">{m.label}</span>
                {m.instant && (
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                    Instant
                  </span>
                )}
              </div>
              <p className="text-[11px] text-surface-500">
                {m.disabled ? m.disabledReason : m.hint}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {m.fee > 0 ? (
                <span className="text-[11px] font-medium text-surface-500 tabular-nums">
                  +{formatIDR(m.fee)}
                </span>
              ) : (
                <span className="text-[11px] font-medium text-emerald-700">Gratis</span>
              )}
              <AnimatePresence>
                {selected && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white"
                  >
                    <CheckCircle weight="fill" className="h-3.5 w-3.5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </button>
        )
      })}
    </div>
  )
}
