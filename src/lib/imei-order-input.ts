/** Shared validation for IMEI order device identifiers. */

export function normalizeSerialNumber(raw: string): string {
  return raw.trim()
}

/** Hanya cek wajib diisi — format divalidasi oleh supplier. */
export function validateImeiValue(value: string): string | null {
  if (!value.trim()) return 'Nomor digital wajib diisi'
  return null
}

/** Hanya cek wajib diisi — format SN divalidasi oleh supplier. */
export function validateSerialNumberValue(value: string): string | null {
  if (!value.trim()) return 'Serial Number wajib diisi'
  return null
}

export type ImeiServiceFieldFlags = {
  requiresImei: boolean
  requiresSn: boolean
}

export type ImeiOrderInputPayload = {
  imei?: string
  serialNumber?: string | null
}

export function validateImeiOrderDeviceInput(
  service: ImeiServiceFieldFlags,
  payload: ImeiOrderInputPayload,
): { imei: string; serialNumber: string | null; error: string | null } {
  const imeiRaw = (payload.imei ?? '').trim()
  const snRaw = (payload.serialNumber ?? '').trim()

  if (service.requiresImei) {
    const imeiErr = validateImeiValue(imeiRaw)
    if (imeiErr) return { imei: imeiRaw, serialNumber: snRaw || null, error: imeiErr }
  }

  let serialNumber: string | null = null
  if (service.requiresSn) {
    const snValue = snRaw || (!service.requiresImei ? imeiRaw : '')
    const snErr = validateSerialNumberValue(snValue)
    if (snErr) return { imei: imeiRaw, serialNumber: snValue || null, error: snErr }
    serialNumber = snValue.trim()
  }

  if (!service.requiresImei && !service.requiresSn) {
    return {
      imei: imeiRaw,
      serialNumber,
      error: 'Layanan belum dikonfigurasi (Digital atau Serial Number)',
    }
  }

  const deviceKey = service.requiresImei ? imeiRaw : (serialNumber ?? '')

  return {
    imei: deviceKey,
    serialNumber,
    error: null,
  }
}
