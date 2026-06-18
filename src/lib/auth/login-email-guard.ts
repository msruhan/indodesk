import type { User } from '@prisma/client'

export const LOGIN_EMAIL_NOT_VERIFIED_MESSAGE =
  'Email belum diverifikasi. Periksa inbox Anda dan klik tautan konfirmasi.'

type LoginUserPick = Pick<User, 'emailVerified'>

export function isLoginEmailVerified(user: LoginUserPick): boolean {
  return Boolean(user.emailVerified)
}
