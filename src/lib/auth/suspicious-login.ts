import { sendEmail } from '@/lib/email'
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

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  await sendEmail({
    to: opts.email,
    subject: 'Login dari perangkat baru — IndoTeknizi',
    html: `<p>Halo ${opts.name ?? 'Pengguna'},</p>
<p>Kami mendeteksi login ke akun Anda dari perangkat atau lokasi yang belum dikenal.</p>
<ul>
<li>IP: ${opts.ip ?? 'tidak diketahui'}</li>
<li>Perangkat: ${opts.userAgent ?? 'tidak diketahui'}</li>
</ul>
<p>Jika ini bukan Anda, segera ganti password di <a href="${baseUrl}/user/settings">${baseUrl}/user/settings</a>.</p>`,
    text: `Login baru terdeteksi untuk ${opts.email}. IP: ${opts.ip ?? 'unknown'}. Jika bukan Anda, ganti password segera.`,
  })
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
