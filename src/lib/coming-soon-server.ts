import { getCachedComingSoon } from '@/lib/coming-soon-cache'
import { isComingSoonForceDisabled } from '@/lib/coming-soon-shared'
import { getPublicComingSoonConfig } from '@/lib/platform-settings'

export const COMING_SOON_ADMIN_ONLY_LOGIN_MESSAGE =
  'Platform dalam soft launch. Hanya admin yang dapat login saat ini.'

/** Apakah mode coming soon aktif (server / API routes). */
export async function isComingSoonEnabled(): Promise<boolean> {
  if (isComingSoonForceDisabled()) return false
  try {
    const cached = await getCachedComingSoon()
    if (cached) return cached.enabled
    const config = await getPublicComingSoonConfig()
    return config.enabled
  } catch {
    return false
  }
}

export async function assertAdminLoginAllowedDuringComingSoon(role: string): Promise<void> {
  if (!(await isComingSoonEnabled())) return
  if (role === 'ADMIN') return
  throw new Error('COMING_SOON_ADMIN_ONLY')
}
