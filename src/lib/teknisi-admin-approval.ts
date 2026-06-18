/** Field User saat teknisi disetujui admin — isActive + emailVerified agar bisa login. */
export function buildTeknisiApprovalUserData(existingEmailVerified: Date | null): {
  isActive: true
  emailVerified?: Date
} {
  return {
    isActive: true,
    ...(existingEmailVerified == null ? { emailVerified: new Date() } : {}),
  }
}

/** Backfill emailVerified untuk teknisi yang sudah APPROVED tapi belum klik tautan email. */
export function shouldBackfillEmailVerified(
  existingEmailVerified: Date | null,
  profileIsVerified: boolean,
  nextIsVerified: boolean | undefined,
): boolean {
  if (existingEmailVerified) return false
  if (nextIsVerified === true) return true
  if (nextIsVerified === false) return false
  return profileIsVerified
}
