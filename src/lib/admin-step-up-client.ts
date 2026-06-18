/** Client-side prompt for sensitive admin API calls (no secrets stored). */
export async function requestAdminStepUpCredentials(
  twoFactorEnabled: boolean,
): Promise<{ confirmPassword?: string; totp?: string } | null> {
  if (twoFactorEnabled) {
    const totp = window.prompt('Masukkan kode 2FA admin untuk melanjutkan:')
    if (!totp?.trim()) return null
    return { totp: totp.trim() }
  }
  const confirmPassword = window.prompt('Masukkan password admin untuk konfirmasi:')
  if (!confirmPassword) return null
  return { confirmPassword }
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
