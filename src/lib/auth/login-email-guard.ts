import type { User } from '@prisma/client'

export const LOGIN_EMAIL_NOT_VERIFIED_MESSAGE =
  'Email belum diverifikasi. Periksa inbox Anda dan klik tautan konfirmasi.'

type LoginUserPick = Pick<User, 'emailVerified' | 'isActive'>

/** Login boleh jika email terverifikasi, atau admin sudah mengaktifkan akun (`isActive`). */
export function isLoginEmailVerified(user: LoginUserPick): boolean {
  if (user.emailVerified) return true
  return Boolean(user.isActive)
}
