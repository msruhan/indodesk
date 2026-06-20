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

const BINDERBYTE_TO_COURIER = Object.fromEntries(
  Object.entries(BINDERBYTE_COURIER_CODE).map(([enumKey, code]) => [code, enumKey as ShippingCourier]),
) as Record<string, ShippingCourier>

/** Kode BinderByte (mis. "jne") → enum Prisma. */
export function fromBinderbyteCourier(code: string | null | undefined): ShippingCourier | null {
  if (!code) return null
  return BINDERBYTE_TO_COURIER[code.toLowerCase().trim()] ?? null
}

export function binderbyteCourierMatchesEnum(
  binderbyteCode: string | null | undefined,
  courier: ShippingCourier,
): boolean {
  if (!binderbyteCode) return true
  return toBinderbyteCourier(courier) === binderbyteCode.toLowerCase().trim()
}

export function courierLabelFromEnum(courier: ShippingCourier): string {
  return SHIPPING_COURIER_OPTIONS.find((o) => o.value === courier)?.label ?? courier
}

export function courierLabelFromBinderbyteCode(code: string | null | undefined): string | null {
  const enumVal = fromBinderbyteCourier(code)
  return enumVal ? courierLabelFromEnum(enumVal) : null
}

/** Kurir yang tersedia di checkout marketplace (subset populer). */
export const CHECKOUT_SHIPPING_COURIER_OPTIONS = SHIPPING_COURIER_OPTIONS.filter((o) =>
  ['WAHANA', 'ANTERAJA', 'JNE', 'JNT', 'SICEPAT', 'POS'].includes(o.value),
)

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
