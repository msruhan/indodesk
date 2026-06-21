import type { BinderbyteTrackResult } from '@/lib/binderbyte-client'
import { BinderbyteError } from '@/lib/binderbyte-client'
import { isTerminalTrackingStatus } from '@/lib/shipping-courier'

/** Resi hanya boleh didaftarkan jika pengiriman baru dimulai (anti resi lama/palsu). */
export const MAX_FRESH_SHIPMENT_AGE_HOURS = 48

function parseBinderbyteDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null
  const d = new Date(value.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

function latestTrackingDescription(result: BinderbyteTrackResult): string {
  return (result.history[0]?.desc ?? result.desc ?? '').trim()
}

function looksDeliveredInDescription(description: string): boolean {
  const s = description.toUpperCase()
  return (
    s.includes('DELIVERED') ||
    s.includes('TERKIRIM') ||
    s.includes(' SAMPAI ') ||
    s.startsWith('SAMPAI ') ||
    s.includes('DITERIMA OLEH') ||
    s.includes('TELAH DITERIMA')
  )
}

export function getEarliestTrackingEventDate(result: BinderbyteTrackResult): Date | null {
  const dates: Date[] = []

  for (const item of result.history) {
    const parsed = parseBinderbyteDate(item.date)
    if (parsed) dates.push(parsed)
  }

  const summaryDate = parseBinderbyteDate(result.date)
  if (summaryDate) dates.push(summaryDate)

  if (dates.length === 0) return null
  return new Date(Math.min(...dates.map((d) => d.getTime())))
}

/**
 * Pastikan resi baru benar-benar dikirim saat ini — bukan resi lama atau yang sudah sampai.
 * Dipanggil saat teknisi/penjual pertama kali mendaftarkan AWB (markShipped).
 */
export function validateFreshShipmentRegistration(
  result: BinderbyteTrackResult,
  now: Date = new Date(),
): void {
  if (isTerminalTrackingStatus(result.status)) {
    throw new BinderbyteError(
      'Resi sudah sampai atau selesai. Gunakan nomor resi baru saat paket benar-benar dikirim.',
      'INVALID_AWB',
    )
  }

  const latestDesc = latestTrackingDescription(result)
  if (looksDeliveredInDescription(latestDesc)) {
    throw new BinderbyteError(
      'Resi sudah sampai. Gunakan nomor resi baru saat paket benar-benar dikirim.',
      'INVALID_AWB',
    )
  }

  const earliest = getEarliestTrackingEventDate(result)
  if (!earliest) {
    throw new BinderbyteError(
      'Resi belum memiliki riwayat pengiriman. Pastikan paket sudah diserahkan ke kurir dan coba lagi.',
      'INVALID_AWB',
    )
  }

  const maxAgeMs = MAX_FRESH_SHIPMENT_AGE_HOURS * 60 * 60 * 1000
  const ageMs = now.getTime() - earliest.getTime()
  if (ageMs > maxAgeMs) {
    throw new BinderbyteError(
      `Resi sudah berjalan lebih dari ${MAX_FRESH_SHIPMENT_AGE_HOURS} jam. Gunakan resi baru saat paket benar-benar dikirim hari ini.`,
      'INVALID_AWB',
    )
  }

  if (earliest.getTime() > now.getTime() + 2 * 60 * 60 * 1000) {
    throw new BinderbyteError('Tanggal resi tidak valid.', 'INVALID_AWB')
  }
}
