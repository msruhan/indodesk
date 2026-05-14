'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Clock, XCircle, Zap } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/data/topup-types'

interface TimelineProps {
  status: OrderStatus
  paid: boolean
}

const steps: { key: OrderStatus; label: string; description: string }[] = [
  { key: 'pending-payment', label: 'Menunggu pembayaran', description: 'Selesaikan pembayaran agar order segera diproses.' },
  { key: 'paid', label: 'Pembayaran diterima', description: 'Order kamu masuk antrian fulfillment otomatis.' },
  { key: 'processing', label: 'Diproses provider', description: 'Sistem kami sedang menghubungi provider game/voucher.' },
  { key: 'fulfilling', label: 'Item dikirim ke akun', description: 'Top up sedang dikirim ke akun kamu.' },
  { key: 'completed', label: 'Selesai', description: 'Cek inventory di game/akun. Terima kasih!' },
]

const order: Record<OrderStatus, number> = {
  'pending-payment': 0,
  paid: 1,
  processing: 2,
  fulfilling: 3,
  completed: 4,
  failed: -1,
}

export function OrderStatusTimeline({ status }: TimelineProps) {
  const currentIndex = order[status]
  const failed = status === 'failed'

  return (
    <ol className="relative space-y-3">
      {/* vertical rail */}
      <span
        aria-hidden
        className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-surface-200 via-surface-200 to-transparent"
      />
      {steps.map((s, i) => {
        const reached = i <= currentIndex
        const active = i === currentIndex && !failed
        const Icon = active ? Zap : reached ? CheckCircle : Clock
        return (
          <li key={s.key} className="relative flex gap-3 pl-0">
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-300',
                reached
                  ? active
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-soft-md'
                    : 'bg-primary-500 text-white'
                  : 'bg-surface-100 text-surface-400',
              )}
            >
              <Icon weight={reached && !active ? 'fill' : 'regular'} className="h-4 w-4" />
              {active && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-primary-400/40"
                  animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p
                className={cn(
                  'text-sm font-semibold',
                  reached ? 'text-ink' : 'text-surface-500',
                )}
              >
                {s.label}
                {active && (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-primary-700">
                    Sedang berlangsung
                  </span>
                )}
              </p>
              <p
                className={cn(
                  'text-[12px] leading-relaxed',
                  reached ? 'text-surface-600' : 'text-surface-400',
                )}
              >
                {s.description}
              </p>
            </div>
          </li>
        )
      })}

      {failed && (
        <li className="relative flex gap-3 pl-0">
          <div className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <XCircle weight="fill" className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-rose-700">Order gagal</p>
            <p className="text-[12px] leading-relaxed text-surface-600">
              Saldo akan otomatis dikembalikan dalam 1×24 jam. Hubungi CS jika tidak masuk.
            </p>
          </div>
        </li>
      )}
    </ol>
  )
}
