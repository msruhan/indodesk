import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { getPlatformSettings } from '@/lib/platform-settings'

type SecurityNotificationInput = {
  title: string
  body: string
  severity: 'WARNING' | 'CRITICAL'
}

/** In-app admin bell + email ke adminEmail untuk event keamanan kritis. */
export async function notifyAdminsSecurityEvent(input: SecurityNotificationInput): Promise<void> {
  try {
    await prisma.platformNotification.create({
      data: {
        title: input.title.slice(0, 120),
        body: input.body.slice(0, 240),
        audiences: ['ADMIN'],
        tone: input.severity === 'CRITICAL' ? 'danger' : 'warning',
        icon: 'warning',
        active: true,
      },
    })
  } catch (e) {
    console.error('[SECURITY_NOTIFICATION]', e)
  }

  if (input.severity !== 'CRITICAL') return

  try {
    const settings = await getPlatformSettings()
    const adminEmail = settings.adminEmail?.trim()
    if (!adminEmail) return

    await sendEmail({
      to: adminEmail,
      subject: `[Keamanan IndoTeknizi] ${input.title}`,
      html: `<p><strong>${input.title}</strong></p><p>${input.body}</p><p>Periksa Admin → Log / Saldo → Keamanan.</p>`,
      text: `${input.title}\n\n${input.body}`,
    })
  } catch (e) {
    console.error('[SECURITY_NOTIFICATION_EMAIL]', e)
  }
}
