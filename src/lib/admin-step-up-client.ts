import { requestAdminStepUpViaDialog } from '@/lib/admin-step-up-bridge'

/** Client-side dialog for sensitive admin API calls (no secrets stored). */
export async function requestAdminStepUpCredentials(
  twoFactorEnabled: boolean,
): Promise<{ confirmPassword?: string; totp?: string } | null> {
  return requestAdminStepUpViaDialog(twoFactorEnabled)
}

export async function fetchAdminTwoFactorEnabled(): Promise<boolean> {
  try {
    const res = await fetch('/api/user/2fa')
    const json = await res.json()
    return Boolean(res.ok && json.success && json.data?.enabled)
  } catch {
    return false
  }
}
