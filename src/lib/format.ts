/**
 * Shared formatting utilities — single source of truth for IDR, dates, numbers.
 * Import from here instead of defining local formatPrice/formatDateTime.
 */

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
})

/** Format angka ke Rupiah: Rp 1.500.000 */
export function formatIdr(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  return idrFormatter.format(num)
}

/** Format Rupiah absolute (selalu positif): Rp 1.500.000 */
export function formatIdrAbs(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  return idrFormatter.format(Math.abs(num))
}

/** Format Rupiah signed: +Rp 500.000 atau -Rp 80.000 */
export function formatIdrSigned(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  if (num >= 0) return `+${idrFormatter.format(num)}`
  return idrFormatter.format(num)
}

/** Format Rupiah compact: Rp 2.4M, Rp 150K */
export function formatIdrCompact(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)}K`
  return idrFormatter.format(num)
}

/** Format tanggal + waktu: 20 Mei 2026, 14.30 */
export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Format tanggal saja: 20 Mei 2026 */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Format waktu saja: 14.30 */
export function formatTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}
