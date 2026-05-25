import type { ShippingCourier } from '@prisma/client'

/** Kode kurir untuk BinderByte API */
export const BINDERBYTE_COURIER_CODE: Record<ShippingCourier, string> = {
  JNE: 'jne',
  POS: 'pos',
  JNT: 'jnt',
  SICEPAT: 'sicepat',
  TIKI: 'tiki',
  ANTERAJA: 'anteraja',
  WAHANA: 'wahana',
  NINJA: 'ninja',
  LION: 'lion',
}

export const SHIPPING_COURIER_OPTIONS: Array<{ value: ShippingCourier; label: string }> = [
  { value: 'JNE', label: 'JNE Express' },
  { value: 'JNT', label: 'J&T Express' },
  { value: 'SICEPAT', label: 'SiCepat' },
  { value: 'POS', label: 'POS Indonesia' },
  { value: 'TIKI', label: 'TIKI' },
  { value: 'ANTERAJA', label: 'AnterAja' },
  { value: 'WAHANA', label: 'Wahana' },
  { value: 'NINJA', label: 'Ninja Xpress' },
  { value: 'LION', label: 'Lion Parcel' },
]

export function toBinderbyteCourier(courier: ShippingCourier): string {
  return BINDERBYTE_COURIER_CODE[courier]
}

export function isTerminalTrackingStatus(status: string | null | undefined): boolean {
  if (!status) return false
  const s = status.toUpperCase()
  return (
    s.includes('DELIVERED') ||
    s.includes('TERKIRIM') ||
    s === 'DELIVERED' ||
    s.includes('RETURN') ||
    s.includes('GAGAL') ||
    s.includes('FAILED') ||
    s.includes('CANCEL')
  )
}
