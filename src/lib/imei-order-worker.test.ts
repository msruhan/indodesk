import { describe, expect, it } from 'vitest'
import {
  buildPlaceImeiOrderAttempts,
  withDhruClassicImeiShell,
} from '@/lib/dhru-fusion'
import { snDeliverViaImeiTag } from '@/lib/imei-supplier-fields'
import { buildDhruOrderFields } from '@/lib/imei-order-worker'

describe('buildDhruOrderFields', () => {
  it('luteam CUSTOM SN: serial via IMEI tag only', () => {
    const fields = buildDhruOrderFields(
      {
        imei: 'HKV93NV4XN',
        serialNumber: 'HKV93NV4XN',
        network: null,
        model: null,
        provider: null,
        pin: null,
        kbh: null,
        mep: null,
        prd: null,
      },
      { snDeliverViaImei: true },
    )
    expect(fields).toEqual({ IMEI: 'HKV93NV4XN' })
  })

  it('standard IMEI: sends any non-empty imei to supplier', () => {
    const fields = buildDhruOrderFields(
      {
        imei: '314536789023456',
        serialNumber: null,
        network: null,
        model: null,
        provider: null,
        pin: null,
        kbh: null,
        mep: null,
        prd: null,
      },
      { snDeliverViaImei: false },
    )
    expect(fields).toEqual({ IMEI: '314536789023456' })
  })

  it('standard Requires.SN: flat SN tag', () => {
    const fields = buildDhruOrderFields(
      {
        imei: 'HKV93NV4XN',
        serialNumber: 'HKV93NV4XN',
        network: null,
        model: null,
        provider: null,
        pin: null,
        kbh: null,
        mep: null,
        prd: null,
      },
      { snDeliverViaImei: false },
    )
    expect(fields).toEqual({ SN: 'HKV93NV4XN' })
  })
})

describe('buildPlaceImeiOrderAttempts', () => {
  it('IMEI order: flat IMEI only, no CUSTOMFIELD-only fallback', () => {
    const attempts = buildPlaceImeiOrderAttempts('39236', { IMEI: '314536789023456' })
    expect(attempts[0]).toEqual({ ID: '39236', IMEI: '314536789023456' })
    expect(attempts.every((a) => !a.CUSTOMFIELD || a.IMEI?.trim())).toBe(true)
  })

  it('luteam SN CUSTOM: IMEI tag only', () => {
    const attempts = buildPlaceImeiOrderAttempts('39893', { IMEI: 'HKV93NV4XN' })
    expect(attempts[0]).toEqual({ ID: '39893', IMEI: 'HKV93NV4XN' })
    expect(attempts.some((a) => 'SN' in a)).toBe(false)
  })

  it('classic SN shell for standard SN services', () => {
    const attempts = buildPlaceImeiOrderAttempts('59', { SN: 'ABC123' })
    expect(attempts[0]).toMatchObject({ ID: '59', SN: 'ABC123', IMEI: '' })
  })
})

describe('snDeliverViaImeiTag', () => {
  it('true for luteam SN-only', () => {
    expect(
      snDeliverViaImeiTag({
        requiresSn: true,
        requiresImei: false,
        api: { host: 'https://luteam.store' },
      }),
    ).toBe(true)
  })
})

describe('withDhruClassicImeiShell', () => {
  it('includes empty standard tags', () => {
    const params = withDhruClassicImeiShell({ ID: '59', SN: 'ABC' })
    expect(params.MODELID).toBe('')
    expect(params.IMEI).toBe('')
    expect(params.SN).toBe('ABC')
  })
})

