import type { Prisma } from '@prisma/client'

/** Filter untuk daftar / detail profil teknisi yang boleh dilihat publik. */
export const PUBLIC_TEKNISI_PROFILE_WHERE: Prisma.TeknisiProfileWhereInput = {
  isProfileHidden: false,
}

export function isTeknisiProfilePubliclyVisible(profile: {
  isProfileHidden?: boolean | null
}): boolean {
  return !profile.isProfileHidden
}
