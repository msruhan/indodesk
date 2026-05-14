'use client'

import { Clock, Headphones, Shield, Zap } from '@/lib/icons'
import { cn } from '@/lib/utils'

const items = [
  { icon: Zap, label: 'Proses 1 menit' },
  { icon: Shield, label: 'Pembayaran aman' },
  { icon: Headphones, label: 'CS 24 jam' },
  { icon: Clock, label: 'Auto-refund jika gagal' },
] as const

interface TrustStripProps {
  className?: string
  /** Compact = mobile-friendly horizontal scroll */
  compact?: boolean
}

export function TrustStrip({ className, compact }: TrustStripProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto scrollbar-hide',
        compact ? 'sm:gap-3' : 'sm:gap-4',
        className,
      )}
    >
      {items.map((item) => (
        <span
          key={item.label}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-surface-200/70 bg-white/70 backdrop-blur-md',
            compact ? 'flex-shrink-0 px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
            'font-medium text-surface-700 shadow-soft-xs',
          )}
        >
          <item.icon className="h-3.5 w-3.5 text-primary-600" />
          {item.label}
        </span>
      ))}
    </div>
  )
}
