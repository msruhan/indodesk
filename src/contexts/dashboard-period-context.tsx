'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  buildPeriodOptions,
  formatPeriodLabel,
  getCurrentPeriod,
  periodKey,
  periodsEqual,
  type DashboardPeriod,
} from '@/lib/dashboard-period'

type DashboardPeriodContextValue = {
  period: DashboardPeriod
  label: string
  options: DashboardPeriod[]
  setPeriod: (period: DashboardPeriod) => void
  isCurrentMonth: boolean
}

const DashboardPeriodContext = createContext<DashboardPeriodContextValue | undefined>(
  undefined,
)

export function DashboardPeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<DashboardPeriod>(() => getCurrentPeriod())
  const options = useMemo(() => buildPeriodOptions(18), [])
  const current = getCurrentPeriod()

  const setPeriod = useCallback((next: DashboardPeriod) => {
    setPeriodState(next)
  }, [])

  const value = useMemo(
    () => ({
      period,
      label: formatPeriodLabel(period),
      options,
      setPeriod,
      isCurrentMonth: periodsEqual(period, current),
    }),
    [period, options, setPeriod, current],
  )

  return (
    <DashboardPeriodContext.Provider value={value}>{children}</DashboardPeriodContext.Provider>
  )
}

export function useDashboardPeriod() {
  const ctx = useContext(DashboardPeriodContext)
  if (!ctx) {
    throw new Error('useDashboardPeriod must be used within DashboardPeriodProvider')
  }
  return ctx
}

/** Safe hook for optional period filter (returns null outside provider). */
export function useDashboardPeriodOptional() {
  return useContext(DashboardPeriodContext)
}
