/** Types & parsers for flexible teknisi store page content. */

export type StoreJourneyIcon =
  | 'message'
  | 'wrench'
  | 'store'
  | 'award'
  | 'clock'
  | 'phone'
  | 'star'

export type StoreJourneyMilestone = {
  year: string
  title: string
  description: string
  icon: StoreJourneyIcon
}

export const STORE_JOURNEY_ICON_OPTIONS: { id: StoreJourneyIcon; label: string }[] = [
  { id: 'message', label: 'Chat / konsultasi' },
  { id: 'wrench', label: 'Servis / perbaikan' },
  { id: 'store', label: 'Toko / workshop' },
  { id: 'award', label: 'Pencapaian' },
  { id: 'clock', label: 'Waktu / proses' },
  { id: 'phone', label: 'Kontak / remote' },
  { id: 'star', label: 'Rating / unggulan' },
]

export const DEFAULT_STORE_JOURNEY: StoreJourneyMilestone[] = [
  {
    year: '2020',
    title: 'Servis Online',
    description:
      'Memulai dari konsultasi & troubleshooting jarak jauh via chat dan remote desktop.',
    icon: 'message',
  },
  {
    year: '2021',
    title: 'Servis Rumahan',
    description:
      'Menerima perangkat dari pelanggan sekitar untuk diperbaiki di rumah. Mulai bangun reputasi.',
    icon: 'wrench',
  },
  {
    year: '2023',
    title: 'Workshop Kecil',
    description:
      'Menyewa tempat kecil, melengkapi peralatan profesional, dan menerima lebih banyak unit.',
    icon: 'store',
  },
  {
    year: '2024',
    title: 'Toko Resmi',
    description:
      'Membuka toko fisik lengkap dengan etalase produk, layanan walk-in, dan tim teknisi.',
    icon: 'award',
  },
]

const JOURNEY_ICONS = new Set<StoreJourneyIcon>(
  STORE_JOURNEY_ICON_OPTIONS.map((o) => o.id),
)

/** Auto-assigned per tahap; teknisi tidak perlu memilih ikon di form. */
export const JOURNEY_ICON_CYCLE: StoreJourneyIcon[] = [
  'message',
  'wrench',
  'store',
  'clock',
  'phone',
  'star',
]

export function assignJourneyIcons(
  items: Pick<StoreJourneyMilestone, 'year' | 'title' | 'description'>[],
): StoreJourneyMilestone[] {
  return items.map((m, idx, arr) => ({
    year: m.year,
    title: m.title,
    description: m.description,
    icon:
      idx === arr.length - 1
        ? 'award'
        : (JOURNEY_ICON_CYCLE[idx % JOURNEY_ICON_CYCLE.length] ?? 'store'),
  }))
}

export function emptyJourneyMilestone(): StoreJourneyMilestone {
  return { year: '', title: '', description: '', icon: 'store' }
}

export function parseLayananList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return []
  const trimmed = raw.trim()
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map((x) => (typeof x === 'string' ? x.trim() : ''))
          .filter(Boolean)
          .slice(0, 24)
      }
    } catch {
      /* fallback comma */
    }
  }
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24)
}

export function parseJourneyMilestones(raw: string | undefined | null): StoreJourneyMilestone[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: StoreJourneyMilestone[] = []
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue
      const row = item as Record<string, unknown>
      const year = String(row.year ?? '').trim()
      const title = String(row.title ?? '').trim()
      const description = String(row.description ?? row.desc ?? '').trim()
      const iconRaw = String(row.icon ?? 'store').trim() as StoreJourneyIcon
      if (!year && !title && !description) continue
      out.push({
        year: year.slice(0, 8),
        title: title.slice(0, 120),
        description: description.slice(0, 500),
        icon: JOURNEY_ICONS.has(iconRaw) ? iconRaw : 'store',
      })
      if (out.length >= 12) break
    }
    return out
  } catch {
    return []
  }
}

export function journeyFromDb(value: unknown): StoreJourneyMilestone[] {
  if (!value) return []
  let raw: StoreJourneyMilestone[]
  if (typeof value === 'string') raw = parseJourneyMilestones(value)
  else {
    try {
      raw = parseJourneyMilestones(JSON.stringify(value))
    } catch {
      return []
    }
  }
  return assignJourneyIcons(
    raw.map(({ year, title, description }) => ({ year, title, description })),
  )
}

export function normalizeJourneyForDb(
  items: StoreJourneyMilestone[],
): StoreJourneyMilestone[] {
  const filtered = items
    .map((m) => ({
      year: m.year.trim(),
      title: m.title.trim(),
      description: m.description.trim(),
    }))
    .filter((m) => m.year || m.title || m.description)
    .slice(0, 12)
  return assignJourneyIcons(filtered)
}
