import type { TeknisiVerificationStatus } from '@prisma/client'

export const TEKNISI_LOGIN_BLOCKED = {
  PENDING: 'PENDING_VERIFICATION',
  REJECTED: 'REJECTED_VERIFICATION',
  NO_PROFILE: 'NO_PROFILE',
} as const

export type TeknisiLoginBlockCode =
  (typeof TEKNISI_LOGIN_BLOCKED)[keyof typeof TEKNISI_LOGIN_BLOCKED]

export function teknisiLoginBlockMessage(
  code: TeknisiLoginBlockCode,
  rejectionReason?: string | null,
): string {
  switch (code) {
    case TEKNISI_LOGIN_BLOCKED.PENDING:
      return 'Pendaftaran teknisi Anda masih menunggu persetujuan admin. Anda akan dapat login setelah disetujui.'
    case TEKNISI_LOGIN_BLOCKED.REJECTED:
      return rejectionReason?.trim()
        ? `Pendaftaran teknisi ditolak: ${rejectionReason.trim()}`
        : 'Pendaftaran teknisi Anda ditolak. Hubungi admin untuk informasi lebih lanjut.'
    case TEKNISI_LOGIN_BLOCKED.NO_PROFILE:
      return 'Profil teknisi belum lengkap. Hubungi admin.'
    default:
      return 'Akun teknisi belum dapat digunakan.'
  }
}

export function isTeknisiLoginAllowed(
  verificationStatus: TeknisiVerificationStatus | null | undefined,
): boolean {
  return verificationStatus === 'APPROVED'
}

export function verificationStatusToApproved(
  status: TeknisiVerificationStatus,
): boolean {
  return status === 'APPROVED'
}
