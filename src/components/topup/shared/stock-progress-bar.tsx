'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StockProgressBarProps {
  sold: number
  quota: number
  className?: string
}

export function StockProgressBar({ sold, quota, className }: StockProgressBarProps) {
  const pct = Math.min(100, Math.round((sold / quota) * 100))
  const lowStock = pct >= 80
  const mediumStock = pct >= 60 && pct < 80

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-[10px] font-medium tabular-nums">
        <span className={cn('text-surface-600', lowStock && 'text-amber-700 font-semibold')}>
          {sold} / {quota} terjual
        </span>
        {lowStock && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
            Hampir habis
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className={cn(
            'h-full rounded-full',
            lowStock
              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
              : mediumStock
              ? 'bg-gradient-to-r from-primary-500 to-amber-400'
              : 'bg-gradient-to-r from-primary-500 to-accent-500',
          )}
        />
      </div>
    </div>
  )
}
