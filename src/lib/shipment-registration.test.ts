import { describe, expect, it } from 'vitest'
import type { BinderbyteTrackResult } from '@/lib/binderbyte-client'
import { BinderbyteError } from '@/lib/binderbyte-client'
import {
  getEarliestTrackingEventDate,
  MAX_FRESH_SHIPMENT_AGE_HOURS,
  validateFreshShipmentRegistration,
} from '@/lib/shipment-registration'

function sampleResult(overrides: Partial<BinderbyteTrackResult> = {}): BinderbyteTrackResult {
  const now = new Date('2026-06-20T10:00:00.000Z')
  return {
    awb: 'JNT1234567890',
    courier: 'jnt',
    status: 'ON PROCESS',
    date: now.toISOString(),
    desc: 'Paket dipickup kurir',
    origin: 'JKT',
    destination: 'BDG',
    shipper: 'Toko A',
    receiver: 'Pembeli B',
    history: [
      {
        date: now.toISOString(),
        desc: 'Paket dipickup kurir',
        location: 'JKT',
      },
    ],
    ...overrides,
  }
}

describe('shipment-registration', () => {
  it('accepts fresh in-transit resi', () => {
    const now = new Date('2026-06-20T12:00:00.000Z')
    expect(() =>
      validateFreshShipmentRegistration(sampleResult(), now),
    ).not.toThrow()
  })

  it('rejects delivered status', () => {
    expect(() =>
      validateFreshShipmentRegistration(
        sampleResult({ status: 'DELIVERED', desc: 'Paket terkirim' }),
      ),
    ).toThrow(BinderbyteError)
  })

  it('rejects resi whose earliest event is too old', () => {
    const now = new Date('2026-06-20T12:00:00.000Z')
    const old = new Date(now.getTime() - (MAX_FRESH_SHIPMENT_AGE_HOURS + 1) * 60 * 60 * 1000)
    expect(() =>
      validateFreshShipmentRegistration(
        sampleResult({
          history: [{ date: old.toISOString(), desc: 'Manifest', location: 'JKT' }],
        }),
        now,
      ),
    ).toThrow(/sudah berjalan/)
  })

  it('rejects resi without tracking history', () => {
    expect(() =>
      validateFreshShipmentRegistration(
        sampleResult({ history: [], date: null, desc: '' }),
      ),
    ).toThrow(/belum memiliki riwayat/)
  })

  it('uses oldest history entry for age check', () => {
    const now = new Date('2026-06-20T12:00:00.000Z')
    const recent = new Date('2026-06-20T11:30:00.000Z')
    const old = new Date('2026-06-15T08:00:00.000Z')
    const result = sampleResult({
      history: [
        { date: recent.toISOString(), desc: 'In transit', location: 'BDG' },
        { date: old.toISOString(), desc: 'Manifest', location: 'JKT' },
      ],
    })

    expect(getEarliestTrackingEventDate(result)?.toISOString()).toBe(old.toISOString())
    expect(() => validateFreshShipmentRegistration(result, now)).toThrow(/sudah berjalan/)
  })
})
