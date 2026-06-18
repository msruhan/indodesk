import { useEffect } from 'react'
import type { DashboardPeriod } from '@/lib/dashboard-period'
import { periodDateRange } from '@/lib/dashboard-period'

function toDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Syncs admin from/to date query params with the shared dashboard month filter. */
export function useSyncPeriodToDateInputs(
  period: DashboardPeriod,
  setFrom: (v: string) => void,
  setTo: (v: string) => void,
) {
  useEffect(() => {
    const { start, end } = periodDateRange(period)
    setFrom(toDateInputValue(start))
    setTo(toDateInputValue(end))
  }, [period, setFrom, setTo])
}
