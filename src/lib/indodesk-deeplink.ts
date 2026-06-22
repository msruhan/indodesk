import { normalizeIndodeskId } from '@/lib/indodesk-otp'

const SCHEME = 'indodesk'

/** Teknisi: buka koneksi remote desktop ke user. */
export function buildIndodeskConnectLink(remoteId: string, password: string): string {
  const id = normalizeIndodeskId(remoteId)
  const params = new URLSearchParams({ password })
  return `${SCHEME}://${id}?${params.toString()}`
}

/** User: set password permanen IndoDesk (mobile; desktop fallback ke salin manual). */
export function buildIndodeskPasswordLink(password: string): string {
  return `${SCHEME}://password/${encodeURIComponent(password)}`
}

export function openIndodeskDeepLink(url: string): void {
  if (typeof window === 'undefined') return
  window.location.href = url
}
