/** Shared month/year filter for dashboard shells. */

export type DashboardPeriod = {
  year: number
  /** 0 = Jan, 11 = Des */
  month: number
}

export function getCurrentPeriod(): DashboardPeriod {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export function formatPeriodLabel(period: DashboardPeriod, locale = 'id-ID'): string {
  const d = new Date(period.year, period.month, 1)
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

export function periodToQuery(period: DashboardPeriod): { year: string; month: string } {
  return {
    year: String(period.year),
    month: String(period.month + 1),
  }
}

/** Inclusive start/end for DB filtering (UTC-safe via local midnight). */
export function periodDateRange(period: DashboardPeriod): { start: Date; end: Date } {
  const start = new Date(period.year, period.month, 1, 0, 0, 0, 0)
  const end = new Date(period.year, period.month + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function isDateInPeriod(isoOrDate: string | Date, period: DashboardPeriod): boolean {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  if (Number.isNaN(d.getTime())) return false
  return d.getFullYear() === period.year && d.getMonth() === period.month
}

/** Last N months including current, newest first. */
export function buildPeriodOptions(count = 18): DashboardPeriod[] {
  const now = new Date()
  const options: DashboardPeriod[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({ year: d.getFullYear(), month: d.getMonth() })
  }
  return options
}

export function periodKey(period: DashboardPeriod): string {
  return `${period.year}-${period.month}`
}

export function periodsEqual(a: DashboardPeriod, b: DashboardPeriod): boolean {
  return a.year === b.year && a.month === b.month
}
