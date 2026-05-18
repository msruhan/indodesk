'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronDown } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import {
  formatPeriodLabel,
  periodKey,
  periodsEqual,
} from '@/lib/dashboard-period'

export function DashboardMonthFilter({ className }: { className?: string }) {
  const { period, label, options, setPeriod } = useDashboardPeriod()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-surface-200/80 bg-white/60 px-3 text-sm text-surface-600 backdrop-blur-md transition-colors hover:border-surface-300 hover:text-ink"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Filter bulan"
      >
        <Calendar className="h-4 w-4" />
        <span className="max-w-[8.5rem] truncate capitalize">{label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute right-0 top-[calc(100%+6px)] z-50 max-h-64 w-52 overflow-y-auto rounded-xl border border-surface-200/70 bg-white p-1 shadow-soft-lg"
          >
            {options.map((opt) => {
              const active = periodsEqual(opt, period)
              return (
                <button
                  key={periodKey(opt)}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setPeriod(opt)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full rounded-lg px-3 py-2 text-left text-sm capitalize transition-colors',
                    active
                      ? 'bg-primary-50 font-medium text-primary-800'
                      : 'text-surface-700 hover:bg-surface-50',
                  )}
                >
                  {formatPeriodLabel(opt)}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
