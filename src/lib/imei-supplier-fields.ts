import type { DhruServiceItem } from '@/lib/dhru-fusion'

/** Dhru Classic: luteam CUSTOM block with customname=SN (not Requires.SN). */
export function hasDhruCustomSnField(svc: Pick<DhruServiceItem, 'CUSTOM' | 'Requires.SN'>): boolean {
  if (svc['Requires.SN'] === 'Required') return false
  const custom = svc.CUSTOM
  if (!custom || typeof custom !== 'object') return false
  const row = custom as Record<string, string>
  return row.allow === '1' && String(row.customname || '').trim().toUpperCase() === 'SN'
}

/** Verified on luteam.store: CUSTOM SN services accept serial in flat <IMEI>, not <SN>. */
export function snDeliverViaImeiTag(service: {
  requiresSn: boolean
  requiresImei: boolean
  api?: { host?: string } | null
}): boolean {
  if (!service.requiresSn || service.requiresImei) return false
  const host = service.api?.host?.toLowerCase() ?? ''
  return host.includes('luteam')
}
