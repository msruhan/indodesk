/** Fallback berat paket (kg) jika data produk tidak tersedia. */
export const DEFAULT_SHIPPING_WEIGHT_KG = 1

/** Kurir yang ditampilkan di checkout — kode BinderByte. */
export const CHECKOUT_COURIER_CODES = [
  'wahana',
  'anteraja',
  'jne',
  'jnt',
  'sicepat',
  'pos',
] as const

export type CheckoutCourierCode = (typeof CHECKOUT_COURIER_CODES)[number]

const CHECKOUT_COURIER_SET = new Set<string>(CHECKOUT_COURIER_CODES)

/** @deprecated gunakan CHECKOUT_COURIER_CODES */
export const CHECKOUT_COURIER_PRIORITY = CHECKOUT_COURIER_CODES

export function isCheckoutCourier(code: string): boolean {
  return CHECKOUT_COURIER_SET.has(code.toLowerCase().trim())
}

export function normalizeShipOriginCouriers(codes: unknown): string[] {
  if (!Array.isArray(codes)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of codes) {
    const code = String(raw).toLowerCase().trim()
    if (!CHECKOUT_COURIER_SET.has(code)) continue
    if (seen.has(code)) continue
    seen.add(code)
    result.push(code)
  }
  return result
}

export function validateShipOriginCouriers(
  couriers: string[],
  options?: { requireAtLeastOne?: boolean },
): string | null {
  if (options?.requireAtLeastOne && couriers.length === 0) {
    return 'Pilih minimal satu kurir pengiriman'
  }
  if (couriers.length > CHECKOUT_COURIER_CODES.length) {
    return 'Terlalu banyak kurir dipilih'
  }
  return null
}

/** Kurir aktif penjual — kosong = semua kurir checkout (data lama). */
export function resolveSellerShippingCouriers(stored: string[] | null | undefined): string[] {
  const normalized = normalizeShipOriginCouriers(stored ?? [])
  if (normalized.length > 0) return normalized
  return [...CHECKOUT_COURIER_CODES]
}

/** Whitelist kurir + satu layanan termurah per kurir, urut harga naik. */
export function filterCheckoutShippingOptions<T extends { courier: string; price: number }>(
  options: T[],
  allowedCouriers: readonly string[] = CHECKOUT_COURIER_CODES,
): T[] {
  const allowedSet = new Set(allowedCouriers.map((c) => c.toLowerCase().trim()))
  const cheapestByCourier = new Map<string, T>()

  for (const opt of options) {
    const code = opt.courier.toLowerCase().trim()
    if (!allowedSet.has(code)) continue

    const current = cheapestByCourier.get(code)
    if (!current || opt.price < current.price) {
      cheapestByCourier.set(code, opt)
    }
  }

  const filtered = allowedCouriers
    .map((code) => cheapestByCourier.get(code.toLowerCase().trim()))
    .filter((opt): opt is T => opt != null)

  filtered.sort((a, b) => a.price - b.price)
  return filtered
}
