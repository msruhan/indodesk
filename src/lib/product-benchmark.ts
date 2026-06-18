import type { ConditionGrade, DeviceType, ProductCategory, ProductWarranty } from '@prisma/client'
import { formatReplacedPartsDisplay } from '@/lib/replaced-parts'

/**
 * Product Benchmark Engine
 * ------------------------
 * Algoritma penilaian objektif untuk membandingkan 2 produk (HP / Tablet / Laptop).
 * Empat pilar: Kondisi, 3uTools (Apple), Spesifikasi, Kelengkapan.
 *
 * Semua fungsi murni (pure) agar mudah di-test. Tidak ada akses DB di sini.
 */

/* ============================================================
   TYPES
   ============================================================ */

export type BenchmarkProductInput = {
  id: string
  name: string
  category: ProductCategory
  deviceType: DeviceType | null
  price: number
  image: string | null
  // Spesifikasi
  ram: string
  storage: string
  // Kelengkapan & garansi
  completeness: string[]
  warranty: ProductWarranty
  // Kondisi terstruktur
  conditionGrade: ConditionGrade | null
  conditionPercent: number | null
  minusNotes: string | null
  // 3uTools terstruktur
  batteryHealth: number | null
  batteryCycle: number | null
  isAllOriginal: boolean | null
  replacedParts: string[]
  trueToneActive: boolean | null
  faceIdWorks: boolean | null
  verified3uTools: boolean
}

export type PillarKey = 'condition' | 'threeUtools' | 'specs' | 'completeness'

export type PillarScore = {
  key: PillarKey
  label: string
  scoreA: number
  scoreB: number
  weight: number // 0-1
  winner: 'A' | 'B' | 'TIE'
  /** true jika pilar di-skip (mis. 3uTools untuk non-Apple) */
  skipped: boolean
}

export type BenchmarkResult = {
  pillars: PillarScore[]
  totalA: number
  totalB: number
  winner: 'A' | 'B' | 'TIE'
  /** value-for-money: skor total per juta rupiah */
  valueA: number
  valueB: number
  valueWinner: 'A' | 'B' | 'TIE'
  insight: string
  /** baris atribut untuk tabel detail */
  attributes: AttributeRow[]
  hasIncompleteData: boolean
}

export type AttributeRow = {
  label: string
  valueA: string
  valueB: string
  winner: 'A' | 'B' | 'TIE' | 'NONE'
}

/* ============================================================
   CONSTANTS
   ============================================================ */

const GRADE_SCORE: Record<ConditionGrade, number> = {
  BNIB: 100,
  LIKE_NEW: 90,
  MULUS: 80,
  NORMAL: 65,
  MINUS: 45,
}

const GRADE_LABEL: Record<ConditionGrade, string> = {
  BNIB: 'Brand New (Segel)',
  LIKE_NEW: 'Like New',
  MULUS: 'Mulus',
  NORMAL: 'Normal',
  MINUS: 'Ada Minus',
}

const WARRANTY_BONUS: Record<ProductWarranty, number> = {
  OFFICIAL: 10,
  STORE: 5,
  NONE: 0,
}

const WARRANTY_LABEL: Record<ProductWarranty, string> = {
  OFFICIAL: 'Garansi Resmi',
  STORE: 'Garansi Toko',
  NONE: 'Tanpa Garansi',
}

/** Skor netral untuk data yang belum diisi teknisi */
const NEUTRAL_SCORE = 50

/* ============================================================
   HELPERS
   ============================================================ */

/** Apakah device punya 3uTools (Apple) */
export function hasThreeUtools(deviceType: DeviceType | null): boolean {
  return deviceType === 'IPHONE' || deviceType === 'IPAD'
}

/**
 * Parse string storage/RAM → angka dalam GB.
 * "256GB" → 256, "1TB" → 1024, "8 GB" → 8, "512" → 512
 * Return null jika tidak bisa di-parse.
 */
export function parseStorageToGB(raw: string | null | undefined): number | null {
  if (!raw) return null
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '')
  const match = cleaned.match(/^([\d.]+)(TB|GB|MB)?/)
  if (!match) return null
  const value = parseFloat(match[1]!)
  if (!Number.isFinite(value)) return null
  const unit = match[2] ?? 'GB'
  if (unit === 'TB') return value * 1024
  if (unit === 'MB') return value / 1024
  return value
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n))
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}

function decideWinner(a: number, b: number, threshold = 0.5): 'A' | 'B' | 'TIE' {
  if (Math.abs(a - b) < threshold) return 'TIE'
  return a > b ? 'A' : 'B'
}

/* ============================================================
   PILLAR SCORING
   ============================================================ */

/** Skor Kondisi (0-100) */
export function scoreCondition(p: BenchmarkProductInput): { score: number; incomplete: boolean } {
  const hasGrade = p.conditionGrade != null
  const hasPercent = p.conditionPercent != null
  if (!hasGrade && !hasPercent) {
    return { score: NEUTRAL_SCORE, incomplete: true }
  }
  const gradeScore = p.conditionGrade ? GRADE_SCORE[p.conditionGrade] : NEUTRAL_SCORE
  const percentScore = p.conditionPercent ?? gradeScore
  const score = gradeScore * 0.7 + percentScore * 0.3
  return { score: clamp(score), incomplete: !hasGrade || !hasPercent }
}

/** Skor 3uTools (0-100) — hanya untuk Apple */
export function scoreThreeUtools(p: BenchmarkProductInput): { score: number; incomplete: boolean } {
  const hasAnyData =
    p.batteryHealth != null ||
    p.isAllOriginal != null ||
    p.trueToneActive != null ||
    p.faceIdWorks != null
  if (!hasAnyData) {
    return { score: NEUTRAL_SCORE, incomplete: true }
  }

  // Battery (0-100)
  const batteryScore = p.batteryHealth ?? NEUTRAL_SCORE

  // Originalitas
  let originalScore: number
  if (p.isAllOriginal === true) {
    originalScore = 100
  } else if (p.replacedParts.length > 0) {
    originalScore = clamp(100 - p.replacedParts.length * 25)
  } else if (p.isAllOriginal === false) {
    originalScore = 50
  } else {
    originalScore = NEUTRAL_SCORE
  }

  // Fungsi (True Tone + Face ID)
  const trueToneScore = p.trueToneActive === true ? 100 : p.trueToneActive === false ? 0 : NEUTRAL_SCORE
  const faceIdScore = p.faceIdWorks === true ? 100 : p.faceIdWorks === false ? 0 : NEUTRAL_SCORE
  const functionScore = (trueToneScore + faceIdScore) / 2

  // Verifikasi screenshot
  const verifiedScore = p.verified3uTools ? 100 : 40

  const score =
    batteryScore * 0.35 + originalScore * 0.3 + functionScore * 0.2 + verifiedScore * 0.15

  const incomplete = p.batteryHealth == null || p.isAllOriginal == null
  return { score: clamp(score), incomplete }
}

/** Skor Spesifikasi (0-100) — relatif antara A & B, pakai Storage + RAM */
export function scoreSpecs(
  a: BenchmarkProductInput,
  b: BenchmarkProductInput,
): { scoreA: number; scoreB: number } {
  const storageA = parseStorageToGB(a.storage)
  const storageB = parseStorageToGB(b.storage)
  const ramA = parseStorageToGB(a.ram)
  const ramB = parseStorageToGB(b.ram)

  // Storage component
  let storageScoreA = NEUTRAL_SCORE
  let storageScoreB = NEUTRAL_SCORE
  if (storageA != null && storageB != null) {
    const max = Math.max(storageA, storageB)
    if (max > 0) {
      storageScoreA = (storageA / max) * 100
      storageScoreB = (storageB / max) * 100
    }
  } else if (storageA != null) {
    storageScoreA = 100
    storageScoreB = NEUTRAL_SCORE
  } else if (storageB != null) {
    storageScoreB = 100
    storageScoreA = NEUTRAL_SCORE
  }

  // RAM component — skip jika salah satu tidak ada data
  const hasRam = ramA != null && ramB != null
  let ramScoreA = 0
  let ramScoreB = 0
  if (hasRam) {
    const max = Math.max(ramA!, ramB!)
    if (max > 0) {
      ramScoreA = (ramA! / max) * 100
      ramScoreB = (ramB! / max) * 100
    }
  }

  // Compose: storage 0.6, RAM 0.4 (jika ada). Jika RAM tidak ada → storage 100%.
  const scoreA = hasRam ? storageScoreA * 0.6 + ramScoreA * 0.4 : storageScoreA
  const scoreB = hasRam ? storageScoreB * 0.6 + ramScoreB * 0.4 : storageScoreB

  return { scoreA: clamp(scoreA), scoreB: clamp(scoreB) }
}

/** Skor Kelengkapan (0-100) */
export function scoreCompleteness(p: BenchmarkProductInput): number {
  const set = new Set(p.completeness)
  let points = 0

  if (set.has('FULLSET')) {
    points = 100
  } else if (set.has('UNIT_ONLY')) {
    points = 40
  } else {
    if (set.has('BOX')) points += 30
    if (set.has('CHARGER')) points += 30
    if (set.has('HEADSET')) points += 15
    if (set.has('MOUSE')) points += 10
    if (set.has('BAG')) points += 10
    // base device presence
    if (
      set.has('HANDPHONE') ||
      set.has('IPHONE') ||
      set.has('ANDROID') ||
      set.has('IPAD') ||
      set.has('MACBOOK') ||
      set.has('LAPTOP') ||
      set.has('PC')
    ) {
      points += 15
    }
    if (set.has('MONITOR')) points += 10
    if (set.has('KEYBOARD')) points += 5
  }

  points += WARRANTY_BONUS[p.warranty]
  return clamp(points)
}

/* ============================================================
   WEIGHTS
   ============================================================ */

export type BenchmarkWeights = {
  condition: number
  threeUtools: number
  specs: number
  completeness: number
}

const DEFAULT_WEIGHTS_APPLE: BenchmarkWeights = {
  condition: 0.3,
  threeUtools: 0.25,
  specs: 0.25,
  completeness: 0.2,
}

const DEFAULT_WEIGHTS_NON_APPLE: BenchmarkWeights = {
  condition: 0.35,
  threeUtools: 0,
  specs: 0.35,
  completeness: 0.3,
}

/**
 * Tentukan bobot berdasarkan apakah KEDUA produk punya 3uTools.
 * Jika salah satu tidak punya 3uTools → pakai bobot non-Apple (skip pilar 3uTools).
 */
export function resolveWeights(
  a: BenchmarkProductInput,
  b: BenchmarkProductInput,
  override?: Partial<BenchmarkWeights>,
): { weights: BenchmarkWeights; useThreeUtools: boolean } {
  const useThreeUtools = hasThreeUtools(a.deviceType) && hasThreeUtools(b.deviceType)
  const base = useThreeUtools ? DEFAULT_WEIGHTS_APPLE : DEFAULT_WEIGHTS_NON_APPLE
  return { weights: { ...base, ...override }, useThreeUtools }
}

/* ============================================================
   MAIN
   ============================================================ */

export function runBenchmark(
  a: BenchmarkProductInput,
  b: BenchmarkProductInput,
  weightOverride?: Partial<BenchmarkWeights>,
): BenchmarkResult {
  const { weights, useThreeUtools } = resolveWeights(a, b, weightOverride)

  const condA = scoreCondition(a)
  const condB = scoreCondition(b)
  const tuA = scoreThreeUtools(a)
  const tuB = scoreThreeUtools(b)
  const specs = scoreSpecs(a, b)
  const compA = scoreCompleteness(a)
  const compB = scoreCompleteness(b)

  const pillars: PillarScore[] = [
    {
      key: 'condition',
      label: 'Kondisi',
      scoreA: round(condA.score),
      scoreB: round(condB.score),
      weight: weights.condition,
      winner: decideWinner(condA.score, condB.score),
      skipped: false,
    },
    {
      key: 'threeUtools',
      label: '3uTools (Hardware)',
      scoreA: round(tuA.score),
      scoreB: round(tuB.score),
      weight: weights.threeUtools,
      winner: useThreeUtools ? decideWinner(tuA.score, tuB.score) : 'TIE',
      skipped: !useThreeUtools,
    },
    {
      key: 'specs',
      label: 'Spesifikasi',
      scoreA: round(specs.scoreA),
      scoreB: round(specs.scoreB),
      weight: weights.specs,
      winner: decideWinner(specs.scoreA, specs.scoreB),
      skipped: false,
    },
    {
      key: 'completeness',
      label: 'Kelengkapan',
      scoreA: round(compA),
      scoreB: round(compB),
      weight: weights.completeness,
      winner: decideWinner(compA, compB),
      skipped: false,
    },
  ]

  // Hitung total tertimbang (skip pilar yang skipped)
  const totalA = round(
    pillars.reduce((sum, p) => (p.skipped ? sum : sum + p.scoreA * p.weight), 0),
  )
  const totalB = round(
    pillars.reduce((sum, p) => (p.skipped ? sum : sum + p.scoreB * p.weight), 0),
  )

  const winner = decideWinner(totalA, totalB, 3)

  // Value for money (skor per juta rupiah)
  const valueA = a.price > 0 ? round((totalA / a.price) * 1_000_000) : 0
  const valueB = b.price > 0 ? round((totalB / b.price) * 1_000_000) : 0
  const valueWinner = decideWinner(valueA, valueB, 0.5)

  const attributes = buildAttributes(a, b, useThreeUtools)
  const hasIncompleteData =
    condA.incomplete || condB.incomplete || (useThreeUtools && (tuA.incomplete || tuB.incomplete))

  const insight = buildInsight(a, b, pillars, winner, totalA, totalB, valueWinner)

  return {
    pillars,
    totalA,
    totalB,
    winner,
    valueA,
    valueB,
    valueWinner,
    insight,
    attributes,
    hasIncompleteData,
  }
}

/* ============================================================
   ATTRIBUTE TABLE + INSIGHT
   ============================================================ */

function fmtBool(v: boolean | null, yes = 'Ya', no = 'Tidak'): string {
  if (v == null) return '—'
  return v ? yes : no
}

function buildAttributes(
  a: BenchmarkProductInput,
  b: BenchmarkProductInput,
  useThreeUtools: boolean,
): AttributeRow[] {
  const rows: AttributeRow[] = []

  // Kondisi
  rows.push({
    label: 'Grade Kondisi',
    valueA: a.conditionGrade ? GRADE_LABEL[a.conditionGrade] : '—',
    valueB: b.conditionGrade ? GRADE_LABEL[b.conditionGrade] : '—',
    winner: gradeWinner(a.conditionGrade, b.conditionGrade),
  })
  rows.push({
    label: 'Kondisi Fisik',
    valueA: a.conditionPercent != null ? `${a.conditionPercent}%` : '—',
    valueB: b.conditionPercent != null ? `${b.conditionPercent}%` : '—',
    winner: numWinner(a.conditionPercent, b.conditionPercent),
  })

  // 3uTools
  if (useThreeUtools) {
    rows.push({
      label: 'Baterai',
      valueA: a.batteryHealth != null ? `${a.batteryHealth}%` : '—',
      valueB: b.batteryHealth != null ? `${b.batteryHealth}%` : '—',
      winner: numWinner(a.batteryHealth, b.batteryHealth),
    })
    rows.push({
      label: 'Cycle Count',
      valueA: a.batteryCycle != null ? String(a.batteryCycle) : '—',
      valueB: b.batteryCycle != null ? String(b.batteryCycle) : '—',
      winner: numWinner(b.batteryCycle, a.batteryCycle), // lebih rendah lebih baik
    })
    rows.push({
      label: 'Semua Original',
      valueA: fmtBool(a.isAllOriginal),
      valueB: fmtBool(b.isAllOriginal),
      winner: boolWinner(a.isAllOriginal, b.isAllOriginal),
    })
    rows.push({
      label: 'Part Diganti',
      valueA: formatReplacedPartsDisplay(a.replacedParts),
      valueB: formatReplacedPartsDisplay(b.replacedParts),
      winner: numWinner(b.replacedParts.length, a.replacedParts.length), // sedikit lebih baik
    })
    rows.push({
      label: 'True Tone',
      valueA: fmtBool(a.trueToneActive, 'Aktif', 'Tidak'),
      valueB: fmtBool(b.trueToneActive, 'Aktif', 'Tidak'),
      winner: boolWinner(a.trueToneActive, b.trueToneActive),
    })
    rows.push({
      label: 'Face ID',
      valueA: fmtBool(a.faceIdWorks, 'Normal', 'Bermasalah'),
      valueB: fmtBool(b.faceIdWorks, 'Normal', 'Bermasalah'),
      winner: boolWinner(a.faceIdWorks, b.faceIdWorks),
    })
    rows.push({
      label: 'Verifikasi 3uTools',
      valueA: a.verified3uTools ? 'Terverifikasi' : 'Belum',
      valueB: b.verified3uTools ? 'Terverifikasi' : 'Belum',
      winner: boolWinner(a.verified3uTools, b.verified3uTools),
    })
  }

  // Spesifikasi
  const storageA = parseStorageToGB(a.storage)
  const storageB = parseStorageToGB(b.storage)
  rows.push({
    label: 'Storage',
    valueA: a.storage || '—',
    valueB: b.storage || '—',
    winner: numWinner(storageA, storageB),
  })
  const ramA = parseStorageToGB(a.ram)
  const ramB = parseStorageToGB(b.ram)
  if (a.ram || b.ram) {
    rows.push({
      label: 'RAM',
      valueA: a.ram || '—',
      valueB: b.ram || '—',
      winner: numWinner(ramA, ramB),
    })
  }

  // Kelengkapan & garansi
  rows.push({
    label: 'Kelengkapan',
    valueA: a.completeness.length > 0 ? a.completeness.join(', ') : '—',
    valueB: b.completeness.length > 0 ? b.completeness.join(', ') : '—',
    winner: numWinner(a.completeness.length, b.completeness.length),
  })
  rows.push({
    label: 'Garansi',
    valueA: WARRANTY_LABEL[a.warranty],
    valueB: WARRANTY_LABEL[b.warranty],
    winner: numWinner(WARRANTY_BONUS[a.warranty], WARRANTY_BONUS[b.warranty]),
  })

  // Harga
  rows.push({
    label: 'Harga',
    valueA: formatIDR(a.price),
    valueB: formatIDR(b.price),
    winner: numWinner(b.price, a.price), // lebih murah lebih baik
  })

  return rows
}

function gradeWinner(a: ConditionGrade | null, b: ConditionGrade | null): AttributeRow['winner'] {
  if (a == null && b == null) return 'NONE'
  const sa = a ? GRADE_SCORE[a] : -1
  const sb = b ? GRADE_SCORE[b] : -1
  if (sa === sb) return 'TIE'
  return sa > sb ? 'A' : 'B'
}

function numWinner(a: number | null, b: number | null): AttributeRow['winner'] {
  if (a == null && b == null) return 'NONE'
  if (a == null) return 'B'
  if (b == null) return 'A'
  if (a === b) return 'TIE'
  return a > b ? 'A' : 'B'
}

function boolWinner(a: boolean | null, b: boolean | null): AttributeRow['winner'] {
  if (a == null && b == null) return 'NONE'
  const va = a === true ? 1 : 0
  const vb = b === true ? 1 : 0
  if (va === vb) return 'TIE'
  return va > vb ? 'A' : 'B'
}

function formatIDR(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function buildInsight(
  a: BenchmarkProductInput,
  b: BenchmarkProductInput,
  pillars: PillarScore[],
  winner: 'A' | 'B' | 'TIE',
  totalA: number,
  totalB: number,
  valueWinner: 'A' | 'B' | 'TIE',
): string {
  const aWins = pillars.filter((p) => !p.skipped && p.winner === 'A').map((p) => p.label)
  const bWins = pillars.filter((p) => !p.skipped && p.winner === 'B').map((p) => p.label)

  const parts: string[] = []

  if (winner === 'TIE') {
    parts.push(`Kedua produk sangat berimbang (${totalA} vs ${totalB}).`)
  } else {
    const winName = winner === 'A' ? a.name : b.name
    const margin = Math.abs(totalA - totalB)
    parts.push(`${winName} unggul tipis dengan selisih ${round(margin)} poin.`)
  }

  if (aWins.length > 0) parts.push(`${a.name} lebih baik di: ${aWins.join(', ')}.`)
  if (bWins.length > 0) parts.push(`${b.name} lebih baik di: ${bWins.join(', ')}.`)

  const priceDiff = Math.abs(a.price - b.price)
  if (priceDiff > 0) {
    const cheaper = a.price < b.price ? a.name : b.name
    parts.push(`${cheaper} lebih murah ${formatIDR(priceDiff)}.`)
  }

  if (valueWinner !== 'TIE') {
    const valueName = valueWinner === 'A' ? a.name : b.name
    parts.push(`Dari sisi value-for-money, ${valueName} lebih worth it.`)
  }

  return parts.join(' ')
}
