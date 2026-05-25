export type PerformanceScoreInput = {
  completionRatePercent: number
  completedSessions: number
  totalSessions: number
  averageResponseMinutes: number | null
  totalView: number
}

export type PerformanceScoreResult = {
  score: number | null
  scoreLabel: string
  hasEnoughData: boolean
  summary: string
}

function responseScoreFromMinutes(mins: number | null): number {
  if (mins == null) return 0.5
  if (mins <= 5) return 1
  if (mins <= 10) return 0.85
  if (mins <= 30) return 0.65
  if (mins <= 60) return 0.45
  return 0.25
}

/** Log-scale normalization: 0 at zero, ~1 at cap. */
function logNorm(value: number, cap: number): number {
  if (value <= 0) return 0
  return Math.min(1, Math.log10(value + 1) / Math.log10(cap + 1))
}

function buildSummary(input: PerformanceScoreInput, score: number): string {
  const parts: string[] = []
  if (input.completionRatePercent >= 80) parts.push('completion tinggi')
  else if (input.completionRatePercent >= 50) parts.push('completion baik')
  else if (input.totalSessions > 0) parts.push('completion perlu ditingkatkan')

  if (input.averageResponseMinutes != null) {
    if (input.averageResponseMinutes <= 10) parts.push('respons cepat')
    else if (input.averageResponseMinutes <= 30) parts.push('respons cukup baik')
    else parts.push('respons bisa dipercepat')
  }

  if (input.completedSessions >= 10) parts.push('pengalaman solid')
  else if (input.completedSessions >= 1) parts.push(`${input.completedSessions} sesi selesai`)

  if (parts.length === 0) return `Skor operasional ${score.toFixed(1)}/10`
  return parts.slice(0, 3).join(' · ')
}

/**
 * Indikator performa operasional 1–10 (tanpa rating ulasan).
 * Bobot: completion 35%, respons 25%, volume sesi 25%, kunjungan profil 15%.
 */
export function calculateTeknisiPerformanceScore(
  input: PerformanceScoreInput,
): PerformanceScoreResult {
  const hasEnoughData = input.totalSessions >= 2 || input.completedSessions >= 1

  if (!hasEnoughData) {
    return {
      score: null,
      scoreLabel: '—',
      hasEnoughData: false,
      summary: 'Butuh minimal 2 sesi atau 1 sesi selesai',
    }
  }

  const completion = input.completionRatePercent / 100
  const response = responseScoreFromMinutes(input.averageResponseMinutes)
  const volume = logNorm(input.completedSessions, 50)
  const views = logNorm(input.totalView, 10_000)

  const raw = 0.35 * completion + 0.25 * response + 0.25 * volume + 0.15 * views
  const score = Math.round((1 + raw * 9) * 10) / 10

  return {
    score,
    scoreLabel: score.toFixed(1),
    hasEnoughData: true,
    summary: buildSummary(input, score),
  }
}
