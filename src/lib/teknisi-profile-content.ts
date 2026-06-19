import {
  defaultOperatingHours,
  normalizeOperatingHours,
  operatingHoursFromDb,
  type StoreOperatingHours,
} from '@/lib/store-operating-hours'

export type ProfileConsultationService = {
  name: string
  description: string
  duration: string
  price: number | null
  popular: boolean
  requiresRemote: boolean
}

export type TeknisiProfileContent = {
  tagline: string | null
  issuesHandled: string | null
  brandFocus: string | null
  workApproach: string | null
  serviceScope: string[]
  languages: string[]
  secondarySkills: string[]
  operatingHours: StoreOperatingHours
  consultationServices: ProfileConsultationService[]
}

export const DEFAULT_SERVICE_SCOPE = [
  'Konsultasi pra-servis dengan estimasi risiko',
  'Remote troubleshooting untuk kasus software',
  'Pengecekan hardware dan rekomendasi sparepart',
  'Update progres dan dokumentasi hasil kerja',
]

export const DEFAULT_ISSUES_HANDLED =
  'Bootloop, layar, water damage, performa lambat, data recovery'

export const DEFAULT_BRAND_FOCUS =
  'Android, iPhone, laptop consumer, dan perangkat daily driver'

export const DEFAULT_WORK_APPROACH =
  'Diagnosis awal, estimasi, eksekusi, quality check, garansi'

export const DEFAULT_TAGLINE_SUFFIX =
  'dengan diagnosis cepat, komunikasi jelas, dan garansi layanan melalui Bantoo.'

export function buildDefaultTagline(specialty: string[]): string {
  const specs = specialty.slice(0, 3).join(', ')
  if (!specs) return `Teknisi handphone ${DEFAULT_TAGLINE_SUFFIX}`
  return `Spesialis ${specs} ${DEFAULT_TAGLINE_SUFFIX}`
}

export function defaultConsultationServices(
  specialty: string[],
  basePrice: number,
): ProfileConsultationService[] {
  const services: ProfileConsultationService[] = [
    {
      name: 'Konsultasi Umum',
      description:
        'Diagnosis perangkat, identifikasi penyebab, rekomendasi langkah tindak lanjut, plus estimasi risiko sebelum eksekusi.',
      duration: '30 menit',
      price: basePrice,
      popular: true,
      requiresRemote: false,
    },
  ]
  const seen = new Set(['konsultasi umum'])
  for (const spec of specialty) {
    const label = spec.trim()
    if (!label) continue
    const name = `Konsultasi ${label}`
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    services.push({
      name,
      description:
        'Sesi fokus untuk kasus spesifik — diagnosis mendalam, rekomendasi solusi, dan estimasi biaya.',
      duration: '30–60 menit',
      price: basePrice,
      popular: false,
      requiresRemote: false,
    })
  }
  return services
}

function parseConsultationServices(raw: unknown): ProfileConsultationService[] {
  if (!Array.isArray(raw)) return []
  const out: ProfileConsultationService[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const name = String(row.name ?? '').trim()
    if (!name) continue
    const priceRaw = row.price
    const price =
      priceRaw === null || priceRaw === undefined || priceRaw === ''
        ? null
        : Number(priceRaw)
    out.push({
      name: name.slice(0, 120),
      description: String(row.description ?? '').trim().slice(0, 500),
      duration: String(row.duration ?? '30 menit').trim().slice(0, 40),
      price:
        price !== null && Number.isFinite(price) && price >= 0 ? Math.round(price) : null,
      popular: row.popular === true,
      requiresRemote: row.requiresRemote === true,
    })
    if (out.length >= 12) break
  }
  return out
}

export function normalizeStringList(raw: unknown, max = 16): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
    .slice(0, max)
}

export function profileContentFromDb(
  profile: {
    tagline?: string | null
    issuesHandled?: string | null
    brandFocus?: string | null
    workApproach?: string | null
    serviceScope?: string[]
    languages?: string[]
    secondarySkills?: string[]
    operatingHours?: unknown
    consultationServices?: unknown
  },
): TeknisiProfileContent {
  return {
    tagline: profile.tagline?.trim() || null,
    issuesHandled: profile.issuesHandled?.trim() || null,
    brandFocus: profile.brandFocus?.trim() || null,
    workApproach: profile.workApproach?.trim() || null,
    serviceScope: profile.serviceScope ?? [],
    languages: profile.languages ?? [],
    secondarySkills: profile.secondarySkills ?? [],
    operatingHours: operatingHoursFromDb(profile.operatingHours),
    consultationServices: parseConsultationServices(profile.consultationServices),
  }
}

export function resolveProfileTagline(tagline: string | null | undefined): string | null {
  return tagline?.trim() || null
}

export function allProfileSkills(specialty: string[], secondarySkills: string[]): string[] {
  return Array.from(
    new Set([...specialty, ...secondarySkills].map((s) => s.trim()).filter(Boolean)),
  ).slice(0, 16)
}

export function normalizeProfileContentForDb(
  content: Partial<TeknisiProfileContent>,
): Partial<TeknisiProfileContent> {
  return {
    tagline: content.tagline?.trim() || null,
    issuesHandled: content.issuesHandled?.trim() || null,
    brandFocus: content.brandFocus?.trim() || null,
    workApproach: content.workApproach?.trim() || null,
    serviceScope: normalizeStringList(content.serviceScope, 12),
    languages: normalizeStringList(content.languages, 8),
    secondarySkills: normalizeStringList(content.secondarySkills, 16),
    operatingHours: normalizeOperatingHours(content.operatingHours ?? defaultOperatingHours()),
    consultationServices: parseConsultationServices(content.consultationServices),
  }
}

export function emptyConsultationService(basePrice: number): ProfileConsultationService {
  return {
    name: '',
    description: '',
    duration: '30 menit',
    price: basePrice,
    popular: false,
    requiresRemote: false,
  }
}

export function parseConsultationServicesFromProfile(raw: unknown): ProfileConsultationService[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    try {
      return parseConsultationServicesFromProfile(JSON.parse(raw))
    } catch {
      return []
    }
  }
  if (!Array.isArray(raw)) return []
  const out: ProfileConsultationService[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const name = String(row.name ?? '').trim()
    if (!name) continue
    const priceRaw = row.price
    const price =
      priceRaw === null || priceRaw === undefined || priceRaw === ''
        ? null
        : Number(priceRaw)
    out.push({
      name: name.slice(0, 120),
      description: String(row.description ?? '').trim().slice(0, 500),
      duration: String(row.duration ?? '30 menit').trim().slice(0, 40),
      price:
        price !== null && Number.isFinite(price) && price >= 0 ? Math.round(price) : null,
      popular: row.popular === true,
      requiresRemote: row.requiresRemote === true,
    })
    if (out.length >= 12) break
  }
  return out
}
