export type TeknisiWeeklyEarningsRow = {
  week: string
  earnings: number
  consultations: number
  remote: number
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

export function buildTeknisiWeeklyEarnings(params: {
  now?: Date
  ledgerEarnings: Array<{ amount: unknown; createdAt: Date; referenceId: string | null }>
  completedKonsultasi: Array<{ id: string; price: unknown; endedAt: Date | null }>
  completedRemote: Array<{ completedAt: Date | null }>
  weeks?: number
}): TeknisiWeeklyEarningsRow[] {
  const now = params.now ?? new Date()
  const weekCount = params.weeks ?? 6
  const ledgerIds = new Set(
    params.ledgerEarnings.map((l) => l.referenceId).filter((id): id is string => Boolean(id)),
  )

  const rows: TeknisiWeeklyEarningsRow[] = []

  for (let w = weekCount - 1; w >= 0; w--) {
    const weekEnd = new Date(now.getTime() - w * MS_PER_WEEK)
    const weekStart = new Date(weekEnd.getTime() - MS_PER_WEEK)

    const inWeek = (d: Date | null | undefined) =>
      Boolean(d && d >= weekStart && d < weekEnd)

    const ledgerSum = params.ledgerEarnings
      .filter((l) => inWeek(l.createdAt))
      .reduce((s, l) => s + Number(l.amount), 0)

    const konsultasiBackfill = params.completedKonsultasi
      .filter((k) => inWeek(k.endedAt) && !ledgerIds.has(k.id))
      .reduce((s, k) => s + Number(k.price), 0)

    const consultations = params.completedKonsultasi.filter((k) => inWeek(k.endedAt)).length
    const remote = params.completedRemote.filter((r) => inWeek(r.completedAt)).length

    rows.push({
      week: `Mg ${weekCount - w}`,
      earnings: ledgerSum + konsultasiBackfill,
      consultations,
      remote,
    })
  }

  return rows
}

/** Week-over-week % change on earnings (last week vs previous). */
export function computeEarningsWowPercent(weekly: TeknisiWeeklyEarningsRow[]): number | null {
  if (weekly.length < 2) return null
  const current = weekly[weekly.length - 1]?.earnings ?? 0
  const previous = weekly[weekly.length - 2]?.earnings ?? 0
  if (previous <= 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}
