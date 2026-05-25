/** Jam operasional toko per hari (Senin–Minggu). */

export const STORE_WEEKDAYS = [
  { key: 'senin', label: 'Senin', short: 'Sen' },
  { key: 'selasa', label: 'Selasa', short: 'Sel' },
  { key: 'rabu', label: 'Rabu', short: 'Rab' },
  { key: 'kamis', label: 'Kamis', short: 'Kam' },
  { key: 'jumat', label: 'Jumat', short: 'Jum' },
  { key: 'sabtu', label: 'Sabtu', short: 'Sab' },
  { key: 'minggu', label: 'Minggu', short: 'Min' },
] as const

export type StoreWeekdayKey = (typeof STORE_WEEKDAYS)[number]['key']

export type StoreDayHours = {
  open: string
  close: string
  closed: boolean
}

export type StoreOperatingHours = Record<StoreWeekdayKey, StoreDayHours>

const WEEKDAY_KEYS = STORE_WEEKDAYS.map((d) => d.key)

function defaultDayHours(open: string, close: string): StoreDayHours {
  return { open, close, closed: false }
}

export function defaultOperatingHours(): StoreOperatingHours {
  return {
    senin: defaultDayHours('09:00', '21:00'),
    selasa: defaultDayHours('09:00', '21:00'),
    rabu: defaultDayHours('09:00', '21:00'),
    kamis: defaultDayHours('09:00', '21:00'),
    jumat: defaultDayHours('09:00', '21:00'),
    sabtu: defaultDayHours('10:00', '20:00'),
    minggu: defaultDayHours('10:00', '20:00'),
  }
}

function parseTimeRange(raw: string | null | undefined): { open: string; close: string } | null {
  if (!raw?.trim()) return null
  const m = raw.trim().match(/(\d{1,2}:\d{2})\s*[–\-—]\s*(\d{1,2}:\d{2})/)
  if (!m) return null
  return { open: normalizeTime(m[1]), close: normalizeTime(m[2]) }
}

export function normalizeTime(value: string): string {
  const m = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return value.trim()
  const h = Math.min(23, Math.max(0, Number(m[1])))
  const min = Math.min(59, Math.max(0, Number(m[2])))
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function operatingHoursFromLegacy(
  jamWeekdays: string | null | undefined,
  jamWeekend: string | null | undefined,
): StoreOperatingHours {
  const weekday = parseTimeRange(jamWeekdays) ?? { open: '09:00', close: '21:00' }
  const weekend = parseTimeRange(jamWeekend) ?? { open: '10:00', close: '20:00' }

  return {
    senin: { ...weekday, closed: false },
    selasa: { ...weekday, closed: false },
    rabu: { ...weekday, closed: false },
    kamis: { ...weekday, closed: false },
    jumat: { ...weekday, closed: false },
    sabtu: { ...weekend, closed: false },
    minggu: { ...weekend, closed: false },
  }
}

function isStoreWeekdayKey(key: string): key is StoreWeekdayKey {
  return (WEEKDAY_KEYS as string[]).includes(key)
}

export function normalizeOperatingHours(raw: unknown): StoreOperatingHours {
  const base = defaultOperatingHours()

  if (!raw || typeof raw !== 'object') return base

  const obj = raw as Record<string, unknown>
  for (const key of WEEKDAY_KEYS) {
    const row = obj[key]
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const closed = r.closed === true
    const open = normalizeTime(String(r.open ?? base[key].open))
    const close = normalizeTime(String(r.close ?? base[key].close))
    base[key] = { open, close, closed }
  }

  return base
}

export function operatingHoursFromDb(
  value: unknown,
  legacy?: { jamWeekdays: string | null; jamWeekend: string | null },
): StoreOperatingHours {
  if (value && typeof value === 'object' && Object.keys(value as object).length > 0) {
    return normalizeOperatingHours(value)
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      return normalizeOperatingHours(JSON.parse(value))
    } catch {
      /* fallback legacy */
    }
  }
  if (legacy?.jamWeekdays || legacy?.jamWeekend) {
    return operatingHoursFromLegacy(legacy.jamWeekdays, legacy.jamWeekend)
  }
  return defaultOperatingHours()
}

export function parseOperatingHoursJson(raw: string | undefined | null): StoreOperatingHours {
  if (!raw?.trim()) return defaultOperatingHours()
  try {
    return normalizeOperatingHours(JSON.parse(raw))
  } catch {
    return defaultOperatingHours()
  }
}

export function formatDayHours(day: StoreDayHours): string {
  if (day.closed) return 'Tutup'
  if (!day.open || !day.close) return '—'
  return `${day.open} – ${day.close}`
}

export function formatOperatingHoursLines(hours: StoreOperatingHours): string[] {
  return STORE_WEEKDAYS.map(({ key, label }) => `${label} · ${formatDayHours(hours[key])}`)
}

/** Ringkas untuk kartu/list (Sen–Jum · 09:00 – 21:00). */
export function summarizeOperatingHours(hours: StoreOperatingHours): {
  jamWeekdays: string | null
  jamWeekend: string | null
  primary: string | null
  detail: string | null
} {
  const lines = formatOperatingHoursLines(hours)
  const openLines = lines.filter((l) => !l.endsWith('Tutup'))

  const weekdayKeys = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'] as const
  const weekendKeys = ['sabtu', 'minggu'] as const

  const weekdayFmt = (keys: readonly StoreWeekdayKey[]) => {
    const active = keys.filter((k) => !hours[k].closed)
    if (active.length === 0) return null
    const first = hours[active[0]!]
    const same = active.every(
      (k) =>
        hours[k].closed === first.closed &&
        hours[k].open === first.open &&
        hours[k].close === first.close,
    )
    return same ? formatDayHours(first) : null
  }

  const jamWeekdays = weekdayFmt(weekdayKeys)
  const jamWeekend = weekdayFmt(weekendKeys)

  const primary =
    jamWeekdays && jamWeekend
      ? `Sen–Jum · ${jamWeekdays}`
      : openLines[0]?.split(' · ').slice(1).join(' · ') ?? null

  const detail = lines.join('\n')

  return {
    jamWeekdays,
    jamWeekend,
    primary,
    detail: detail || null,
  }
}

export function operatingHoursForDb(hours: StoreOperatingHours): StoreOperatingHours {
  return normalizeOperatingHours(hours)
}
