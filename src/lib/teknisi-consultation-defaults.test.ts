import { describe, expect, it } from 'vitest'
import { buildTeknisiConsultationServices } from '@/lib/konsultasi-services'
import { profileContentFromDb } from '@/lib/teknisi-profile-content'

describe('teknisi consultation services defaults', () => {
  it('returns empty list when DB consultationServices is default []', () => {
    const content = profileContentFromDb({
      consultationServices: [],
    })
    expect(content.consultationServices).toEqual([])
  })

  it('does not auto-generate packages from specialty on read', () => {
    const content = profileContentFromDb({
      consultationServices: null,
    })
    expect(content.consultationServices).toEqual([])

    const services = buildTeknisiConsultationServices({
      specialty: ['Flashing / Firmware', 'Water Damage', 'IC Repair'],
      price: 0,
      consultationServices: [],
    })
    expect(services).toEqual([])
  })

  it('only exposes services explicitly stored in profile', () => {
    const services = buildTeknisiConsultationServices({
      specialty: ['Flashing / Firmware'],
      price: 50_000,
      consultationServices: [
        {
          name: 'Konsultasi Custom',
          description: 'Paket buatan teknisi',
          duration: '45 menit',
          price: 75_000,
          popular: false,
          requiresRemote: false,
        },
      ],
    })

    expect(services).toHaveLength(1)
    expect(services[0]?.name).toBe('Konsultasi Custom')
  })
})
