import type { InspectionDeviceCategory } from '@prisma/client'

export type ChecklistResult = 'pass' | 'fail' | 'unknown'

export type ChecklistItemResult = {
  key: string
  label: string
  result: ChecklistResult
  note?: string
}

export const HANDPHONE_CHECKLIST_ITEMS = [
  { key: 'body', label: 'Kondisi body & layar' },
  { key: 'touch', label: 'Touch & dead pixel' },
  { key: 'camera', label: 'Kamera depan & belakang' },
  { key: 'audio', label: 'Speaker & microphone' },
  { key: 'charging', label: 'Port charging' },
  { key: 'battery', label: 'Kesehatan baterai' },
  { key: 'connectivity', label: 'WiFi, Bluetooth, sinyal' },
  { key: 'imei', label: 'IMEI / keaslian' },
  { key: 'performance', label: 'Performa dasar' },
] as const

export const LAPTOP_CHECKLIST_ITEMS = [
  { key: 'body', label: 'Body, layar, keyboard, trackpad' },
  { key: 'ports', label: 'Port USB, HDMI, audio' },
  { key: 'battery', label: 'Kesehatan baterai' },
  { key: 'storage', label: 'Storage & RAM sesuai klaim' },
  { key: 'thermal', label: 'Thermal / performa ringan' },
  { key: 'camera_mic', label: 'Kamera, mic, speaker' },
  { key: 'serial', label: 'Serial & lisensi OS' },
] as const

export function getChecklistTemplate(category: InspectionDeviceCategory) {
  const items = category === 'LAPTOP' ? LAPTOP_CHECKLIST_ITEMS : HANDPHONE_CHECKLIST_ITEMS
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    result: 'unknown' as ChecklistResult,
    note: '',
  }))
}

export function parseChecklistData(raw: unknown): ChecklistItemResult[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (item): item is ChecklistItemResult =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as ChecklistItemResult).key === 'string' &&
      typeof (item as ChecklistItemResult).label === 'string',
  )
}
