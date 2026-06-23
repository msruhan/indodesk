export type ErrorPageKind =
  | 'client-crash'
  | 'chunk-load'
  | 'network'
  | 'not-found'
  | 'server'
  | 'unknown'

export type ErrorPageContent = {
  kind: ErrorPageKind
  title: string
  description: string
  hint?: string
  statusLabel: string
}

export const NOT_FOUND_CONTENT: ErrorPageContent = {
  kind: 'not-found',
  statusLabel: '404',
  title: 'Halaman tidak ditemukan',
  description:
    'Tautan mungkin sudah tidak aktif, salah ketik, atau halaman telah dipindahkan.',
  hint: 'Periksa kembali alamat URL atau kembali ke beranda.',
}

export const GENERIC_SERVER_CONTENT: ErrorPageContent = {
  kind: 'server',
  statusLabel: '500',
  title: 'Terjadi gangguan pada server',
  description:
    'Kami tidak dapat memuat halaman ini saat ini. Tim kami telah diberi tahu dan sedang menangani masalahnya.',
  hint: 'Coba lagi dalam beberapa saat atau hubungi dukungan jika masalah berlanjut.',
}

const CLIENT_CRASH_CONTENT: ErrorPageContent = {
  kind: 'client-crash',
  statusLabel: 'Kesalahan',
  title: 'Aplikasi mengalami gangguan sementara',
  description:
    'Terjadi kesalahan saat memuat bagian dari halaman ini. Ini biasanya bersifat sementara dan dapat diperbaiki dengan memuat ulang.',
  hint: 'Jika Anda baru saja login atau berpindah menu, coba muat ulang halaman.',
}

const CHUNK_LOAD_CONTENT: ErrorPageContent = {
  kind: 'chunk-load',
  statusLabel: 'Pembaruan',
  title: 'Versi aplikasi telah diperbarui',
  description:
    'Browser Anda masih menyimpan versi lama. Muat ulang halaman untuk mendapatkan versi terbaru Bantoo.',
  hint: 'Tekan Ctrl+Shift+R (Windows) atau Cmd+Shift+R (Mac) untuk muat ulang penuh.',
}

const NETWORK_CONTENT: ErrorPageContent = {
  kind: 'network',
  statusLabel: 'Jaringan',
  title: 'Koneksi terputus',
  description:
    'Kami tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.',
  hint: 'Pastikan Wi‑Fi atau data seluler aktif sebelum mencoba ulang.',
}

const UNKNOWN_CONTENT: ErrorPageContent = {
  kind: 'unknown',
  statusLabel: 'Kesalahan',
  title: 'Terjadi kesalahan yang tidak terduga',
  description:
    'Maaf, sesuatu tidak berjalan seperti seharusnya. Silakan coba lagi atau hubungi tim dukungan kami.',
  hint: 'Sertakan kode referensi di bawah saat menghubungi dukungan.',
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

/** Map raw Error ke salinan yang ramah pengguna (Bahasa Indonesia). */
export function classifyError(error: Error & { digest?: string }): ErrorPageContent {
  const message = error.message ?? ''
  const name = error.name ?? ''
  const combined = `${name} ${message}`

  if (
    matchesAny(combined, [
      /Loading chunk/i,
      /ChunkLoadError/i,
      /dynamically imported module/i,
      /Importing a module script failed/i,
    ])
  ) {
    return CHUNK_LOAD_CONTENT
  }

  if (
    matchesAny(combined, [
      /must be used within/i,
      /Context/i,
      /Provider/i,
      /Minified React error/i,
    ])
  ) {
    return CLIENT_CRASH_CONTENT
  }

  if (
    matchesAny(combined, [
      /fetch/i,
      /network/i,
      /NetworkError/i,
      /Failed to fetch/i,
      /ECONNREFUSED/i,
      /timeout/i,
    ])
  ) {
    return NETWORK_CONTENT
  }

  if (matchesAny(combined, [/Hydration failed/i, /hydrat/i])) {
    return {
      ...CLIENT_CRASH_CONTENT,
      hint: 'Muat ulang halaman. Jika masalah berulang, kosongkan cache browser.',
    }
  }

  return UNKNOWN_CONTENT
}
