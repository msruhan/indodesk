/**
 * Narasi kronologi log aktivitas — teks manusiawi untuk admin memahami kejadian.
 */

export type ActivityLogNarrativeInput = {
  action: string
  category: string
  severity: string
  summary: string
  detail?: string | null
  actorName?: string | null
  actorEmail?: string | null
  actorRole?: string | null
  ip?: string | null
  metadata?: Record<string, unknown> | null
  createdAt?: string | null
}

function formatMoney(value: unknown): string {
  const n = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : NaN
  if (!Number.isFinite(n)) return String(value ?? '—')
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatActor(input: ActivityLogNarrativeInput): string {
  if (input.actorName?.trim()) return input.actorName.trim()
  if (input.actorEmail?.trim()) return input.actorEmail.trim()
  if (input.actorRole) return `pengguna berperan ${input.actorRole}`
  if (input.category === 'SYSTEM') return 'sistem otomatis'
  return 'pihak tidak dikenal'
}

function formatTime(iso?: string | null): string {
  if (!iso) return 'waktu tidak tercatat'
  return new Date(iso).toLocaleString('id-ID')
}

function metaNum(meta: Record<string, unknown> | null | undefined, key: string): number | null {
  const v = meta?.[key]
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function buildWalletReconciliationDriftChronology(
  count: number,
  drifts: Array<{ drift?: string; userId?: string }>,
): string {
  const maxDrift = drifts.reduce((max, d) => {
    const n = parseFloat(d.drift ?? '0')
    return Number.isFinite(n) && Math.abs(n) > Math.abs(max) ? n : max
  }, 0)

  const sampleUsers = drifts
    .slice(0, 3)
    .map((d) => d.userId)
    .filter(Boolean)
    .join(', ')

  let text =
    `Telah ditemukan aktivitas mencurigakan berupa ketidaksesuaian saldo wallet (drift) oleh sistem otomatis ` +
    `saat melakukan proses rekonsiliasi wallet. Sistem membandingkan saldo tercatat dengan total entri ledger ` +
    `dan mendeteksi ${count} wallet dengan selisih.`

  if (maxDrift !== 0) {
    text += ` Drift terbesar yang terdeteksi: ${formatMoney(maxDrift)}.`
  }
  if (sampleUsers) {
    text += ` Contoh pengguna terdampak: ${sampleUsers}.`
  }
  text += ' Rekomendasi: segera audit wallet terkait dan telusuri entri ledger yang tidak konsisten.'
  return text
}

const ACTION_NARRATIVES: Record<
  string,
  (input: ActivityLogNarrativeInput, meta: Record<string, unknown>) => string
> = {
  'wallet.reconciliation.drift': (input, meta) => {
    const count = metaNum(meta, 'count') ?? 0
    const drifts = Array.isArray(meta.drifts)
      ? (meta.drifts as Array<{ drift?: string; userId?: string }>)
      : []
    if (meta.chronology && typeof meta.chronology === 'string') return meta.chronology
    return buildWalletReconciliationDriftChronology(count, drifts)
  },

  'auth.suspicious.brute_force': (input, meta) => {
    const attempts = metaNum(meta, 'attempts') ?? 0
    const window = metaNum(meta, 'windowMinutes') ?? 15
    const email = (meta.email as string) ?? input.actorEmail ?? 'akun tidak dikenal'
    const ip = input.ip ?? 'IP tidak tercatat'
    return (
      `Telah terdeteksi aktivitas mencurigakan berupa serangan brute force terhadap autentikasi oleh ${formatActor(input)}. ` +
      `Dalam ${window} menit terakhir tercatat ${attempts} percobaan login gagal untuk ${email} dari ${ip}, ` +
      `melebihi ambang batas keamanan platform. Sistem mencatat kejadian ini pada ${formatTime(input.createdAt)} ` +
      `dan menandainya sebagai CRITICAL. Rekomendasi: pertimbangkan pemblokiran sementara IP atau akun terkait.`
    )
  },

  'auth.suspicious.repeated_failed': (input, meta) => {
    const attempts = metaNum(meta, 'attempts') ?? 0
    const window = metaNum(meta, 'windowMinutes') ?? 15
    const email = (meta.email as string) ?? input.actorEmail ?? 'akun tidak dikenal'
    return (
      `Telah terdeteksi pola aktivitas mencurigakan berupa percobaan login gagal berulang oleh ${formatActor(input)}. ` +
      `Dalam ${window} menit terakhir ada ${attempts} percobaan gagal untuk ${email}. ` +
      `Kejadian dicatat pada ${formatTime(input.createdAt)} sebagai peringatan dini sebelum ambang brute force tercapai.`
    )
  },

  'auth.login.failed': (input, meta) => {
    const email = (meta.email as string) ?? input.actorEmail ?? 'akun tidak dikenal'
    const ip = input.ip ?? 'IP tidak tercatat'
    return (
      `Tercatat percobaan login gagal oleh ${email} dari ${ip} pada ${formatTime(input.createdAt)}. ` +
      `Aktivitas ini dicatat untuk memantau pola akses yang tidak berhasil.`
    )
  },

  'auth.2fa.failed': (input) =>
    `Telah terdeteksi aktivitas mencurigakan berupa verifikasi 2FA gagal oleh ${formatActor(input)} ` +
    `pada ${formatTime(input.createdAt)}${input.ip ? ` dari IP ${input.ip}` : ''}. ` +
    `Kemungkinan ada percobaan akses tanpa otorisasi penuh.`,

  'account.password.wrong_current': (input) =>
    `Telah terdeteksi percobaan mengubah kata sandi dengan memasukkan kata sandi saat ini yang salah oleh ${formatActor(input)} ` +
    `pada ${formatTime(input.createdAt)}${input.ip ? ` dari IP ${input.ip}` : ''}. ` +
    `Ini dapat mengindikasikan akses tidak sah atau kesalahan pengguna.`,

  'payment.withdraw.request': (input, meta) => {
    const amount = meta.amount != null ? formatMoney(meta.amount) : null
    return (
      `Pengguna ${formatActor(input)} mengajukan permintaan penarikan saldo` +
      `${amount ? ` sebesar ${amount}` : ''} pada ${formatTime(input.createdAt)}. ` +
      `Permintaan menunggu verifikasi dan pemrosesan admin sesuai SLA 1×24 jam.`
    )
  },
}

function genericSuspiciousNarrative(input: ActivityLogNarrativeInput): string | null {
  if (input.severity !== 'WARNING' && input.severity !== 'CRITICAL') return null
  if (input.category !== 'SECURITY' && input.category !== 'SYSTEM') return null

  return (
    `Telah ditemukan aktivitas dengan tingkat ${input.severity === 'CRITICAL' ? 'kritis' : 'peringatan'} ` +
    `pada kategori ${input.category.toLowerCase()}. ${input.summary} ` +
    `Dilakukan oleh ${formatActor(input)} pada ${formatTime(input.createdAt)}` +
    `${input.ip ? ` dari IP ${input.ip}` : ''}.`
  )
}

/**
 * Bangun narasi kronologi untuk ditampilkan di detail log admin.
 * Prioritas: metadata.chronology → template per action → fallback suspicious generic.
 */
export function buildActivityLogChronology(input: ActivityLogNarrativeInput): string | null {
  const meta = (input.metadata ?? {}) as Record<string, unknown>

  if (typeof meta.chronology === 'string' && meta.chronology.trim()) {
    return meta.chronology.trim()
  }

  const builder = ACTION_NARRATIVES[input.action]
  if (builder) return builder(input, meta)

  return genericSuspiciousNarrative(input)
}
