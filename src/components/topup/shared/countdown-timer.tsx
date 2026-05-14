'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  /** ISO date string */
  endsAt: string
  /** Compact pill style (used inside cards). Default is full label. */
  compact?: boolean
  /** Called once when the timer hits zero */
  onExpire?: () => void
  className?: string
}

const pad = (n: number) => n.toString().padStart(2, '0')

export function CountdownTimer({ endsAt, compact, onExpire, className }: CountdownTimerProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const target = new Date(endsAt).getTime()
  const diff = Math.max(0, target - now)

  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const expired = diff === 0
  useEffect(() => {
    if (expired) onExpire?.()
  }, [expired, onExpire])

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-700 ring-1 ring-inset ring-amber-200/70',
          expired && 'bg-surface-100 text-surface-500 ring-surface-200',
          className,
        )}
      >
        {expired ? 'Berakhir' : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
      </span>
    )
  }

  if (expired) {
    return (
      <span className={cn('text-xs text-surface-500', className)}>
        Flash sale berakhir
      </span>
    )
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="text-xs font-medium text-surface-600">Berakhir dalam</span>
      <div className="flex items-center gap-0.5 text-xs font-bold tabular-nums text-ink">
        <span className="rounded-md bg-ink px-1.5 py-0.5 text-white">{pad(hours)}</span>
        <span className="text-ink">:</span>
        <span className="rounded-md bg-ink px-1.5 py-0.5 text-white">{pad(minutes)}</span>
        <span className="text-ink">:</span>
        <span className="rounded-md bg-ink px-1.5 py-0.5 text-white">{pad(seconds)}</span>
      </div>
    </div>
  )
}
