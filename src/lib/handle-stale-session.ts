'use client'

import { completeClientLogout } from '@/lib/auth/client-logout'
import { SESSION_STALE_CODE } from '@/lib/api-constants'

type ApiJson = {
  success?: boolean
  error?: string
  code?: string
}

/** Logout otomatis jika JWT mengacu ke user yang sudah tidak ada di DB (setelah seed). */
export async function handleStaleSessionResponse(
  res: Response,
  data: ApiJson,
): Promise<boolean> {
  if (res.status === 401 && data.code === SESSION_STALE_CODE) {
    await completeClientLogout({ callbackUrl: '/login' })
    window.location.assign('/login')
    return true
  }
  return false
}
