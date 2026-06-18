import { buildSuspiciousLoginEmail, sendEmail } from '@/lib/email'
import { createUserSession } from '@/lib/auth/session-store'

export async function onLoginSuccess(opts: {
  userId: string
  email: string
  name: string | null
  ip?: string | null
  userAgent?: string | null
}): Promise<void> {
  const { isNewDevice } = await createUserSession({
    userId: opts.userId,
    ip: opts.ip,
    userAgent: opts.userAgent,
    deviceLabel: parseDeviceLabel(opts.userAgent),
  })

  if (!isNewDevice) return

  const payload = buildSuspiciousLoginEmail({
    name: opts.name,
    email: opts.email,
    ip: opts.ip,
    userAgent: opts.userAgent,
  })
  await sendEmail({ ...payload, to: opts.email })
}

function parseDeviceLabel(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null
  if (/iPhone|iPad/i.test(userAgent)) return 'iOS'
  if (/Android/i.test(userAgent)) return 'Android'
  if (/Windows/i.test(userAgent)) return 'Windows'
  if (/Mac OS/i.test(userAgent)) return 'macOS'
  if (/Linux/i.test(userAgent)) return 'Linux'
  return 'Browser'
}
