/** Opsi part yang bisa diganti — disimpan sebagai slug di database. */
export const REPLACED_PART_OPTIONS = [
  { value: 'battery', label: 'Battery' },
  { value: 'front_camera', label: 'Kamera Depan' },
  { value: 'rear_camera', label: 'Kamera Belakang' },
  { value: 'lcd', label: 'LCD / Layar' },
  { value: 'casing', label: 'Casing / Back Glass' },
  { value: 'charging_port', label: 'Port Charging' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'microphone', label: 'Mikrofon' },
  { value: 'face_id', label: 'Face ID Module' },
  { value: 'wifi_antenna', label: 'Antena WiFi' },
  { value: 'battery_connector', label: 'Konektor Baterai' },
  { value: 'motherboard', label: 'Motherboard' },
  { value: 'other', label: 'Lainnya' },
] as const

export type ReplacedPartValue = (typeof REPLACED_PART_OPTIONS)[number]['value']

const VALUE_SET = new Set<string>(REPLACED_PART_OPTIONS.map((o) => o.value))

const LABEL_TO_VALUE = new Map(
  REPLACED_PART_OPTIONS.map((o) => [o.label.toLowerCase(), o.value]),
)

/** Normalisasi nilai lama (mis. "Battery", "Screen") ke slug standar. */
export function normalizeReplacedPart(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const lower = trimmed.toLowerCase()
  if (VALUE_SET.has(lower)) return lower

  const byLabel = LABEL_TO_VALUE.get(lower)
  if (byLabel) return byLabel

  if (lower === 'battery' || lower.includes('baterai')) return 'battery'
  if (lower.includes('kamera depan') || lower === 'front camera') return 'front_camera'
  if (lower.includes('kamera belakang') || lower === 'rear camera' || lower === 'back camera')
    return 'rear_camera'
  if (lower === 'screen' || lower.includes('layar') || lower === 'lcd') return 'lcd'
  if (lower.includes('casing') || lower.includes('back glass')) return 'casing'

  return lower.replace(/\s+/g, '_')
}

export function normalizeReplacedParts(parts: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const part of parts) {
    const normalized = normalizeReplacedPart(part)
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized)
      result.push(normalized)
    }
  }
  return result
}

export function replacedPartLabel(value: string): string {
  const found = REPLACED_PART_OPTIONS.find((o) => o.value === value)
  if (found) return found.label
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function formatReplacedPartsDisplay(parts: string[]): string {
  const normalized = normalizeReplacedParts(parts)
  if (normalized.length === 0) return 'Tidak ada'
  return normalized.map(replacedPartLabel).join(', ')
}
