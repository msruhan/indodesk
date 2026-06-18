import { describe, expect, it } from 'vitest'
import {
  buildTeknisiApprovalUserData,
  shouldBackfillEmailVerified,
} from './teknisi-admin-approval'

describe('buildTeknisiApprovalUserData', () => {
  it('mengaktifkan akun dan mengisi emailVerified jika belum ada', () => {
    const data = buildTeknisiApprovalUserData(null)
    expect(data.isActive).toBe(true)
    expect(data.emailVerified).toBeInstanceOf(Date)
  })

  it('tidak menimpa emailVerified yang sudah ada', () => {
    const verifiedAt = new Date('2024-01-01')
    const data = buildTeknisiApprovalUserData(verifiedAt)
    expect(data.isActive).toBe(true)
    expect(data.emailVerified).toBeUndefined()
  })
})

describe('shouldBackfillEmailVerified', () => {
  it('true saat admin menyetujui teknisi', () => {
    expect(shouldBackfillEmailVerified(null, false, true)).toBe(true)
  })

  it('true saat teknisi sudah verified tapi email belum', () => {
    expect(shouldBackfillEmailVerified(null, true, undefined)).toBe(true)
  })

  it('false jika email sudah terverifikasi', () => {
    expect(shouldBackfillEmailVerified(new Date(), true, true)).toBe(false)
  })

  it('false saat admin menarik verifikasi', () => {
    expect(shouldBackfillEmailVerified(null, true, false)).toBe(false)
  })
})
