/**
 * Konfigurasi halaman Coming Soon — aman untuk client & edge middleware.
 */

export type ComingSoonConfig = {
  enabled: boolean
  launchAt: string | null
  headline: string
  message: string
}

export const DEFAULT_COMING_SOON_HEADLINE = 'Sesuatu yang Besar Segera Hadir'
export const DEFAULT_COMING_SOON_MESSAGE =
  'Kami sedang menyiapkan platform terbaik untuk ekosistem HP Indonesia. Nantikan peluncurannya!'

export const COMING_SOON_LOGIN_BLOCKED_TITLE = 'Situs masih dalam mode Coming Soon'

/** Pesan saat user/teknisi mencoba login saat soft launch. */
export const COMING_SOON_LOGIN_BLOCKED_MESSAGE =
  'Terima kasih sudah mendaftar! Saat ini Bantoo.in masih dalam tahap persiapan peluncuran. Login untuk pengguna dan teknisi belum dibuka — kami akan memberitahu Anda segera setelah platform resmi diluncurkan. Untuk info lebih lanjut, hubungi kami di hello@bantoo.in.'

/** @deprecated Use COMING_SOON_LOGIN_BLOCKED_MESSAGE */
export const COMING_SOON_ADMIN_ONLY_LOGIN_MESSAGE = COMING_SOON_LOGIN_BLOCKED_MESSAGE

export const DEFAULT_COMING_SOON_CONFIG: ComingSoonConfig = {
  enabled: false,
  launchAt: null,
  headline: DEFAULT_COMING_SOON_HEADLINE,
  message: DEFAULT_COMING_SOON_MESSAGE,
}

/** Path yang tetap dapat diakses saat mode coming soon aktif (selain admin). */
export function isComingSoonBypassPath(pathname: string): boolean {
  if (pathname === '/coming-soon') return true
  if (pathname === '/login') return true
  if (pathname === '/lupa-password') return true
  if (pathname === '/auth/continue' || pathname.startsWith('/auth/')) return true
  if (pathname.startsWith('/admin')) return true
  if (pathname.startsWith('/api/admin')) return true
  if (pathname.startsWith('/api/public/coming-soon')) return true
  if (pathname === '/api/health') return true
  if (pathname.startsWith('/api/platform/')) return true
  if (pathname.startsWith('/api/telegram/')) return true
  if (pathname.startsWith('/api/teknisi/telegram/')) return true
  /** Registrasi user & teknisi tetap dibuka saat soft launch */
  if (pathname === '/register' || pathname.startsWith('/register/')) return true
  if (pathname.startsWith('/api/auth/register')) return true
  if (pathname.startsWith('/api/auth/google/register-intent')) return true
  if (pathname.startsWith('/api/auth')) return true
  /** Logo & aset statis publik — harus tetap bisa dimuat di halaman coming soon */
  if (pathname.startsWith('/icon/')) return true
  return false
}

/** Override darurat via env — matikan redirect coming soon di seluruh middleware. */
export function isComingSoonForceDisabled(): boolean {
  return process.env.COMING_SOON_FORCE_DISABLED?.trim().toLowerCase() === 'true'
}

export function shouldBypassComingSoon(
  pathname: string,
  role: string | null | undefined,
): boolean {
  if (role === 'ADMIN') return true
  return isComingSoonBypassPath(pathname)
}

export type CountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  isComplete: boolean
}

export function getCountdownParts(targetIso: string | null, now = Date.now()): CountdownParts {
  if (!targetIso) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isComplete: true }
  }

  const target = Date.parse(targetIso)
  if (Number.isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isComplete: true }
  }

  const totalMs = Math.max(0, target - now)
  if (totalMs === 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isComplete: true }
  }

  const totalSeconds = Math.floor(totalMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds, totalMs, isComplete: false }
}
