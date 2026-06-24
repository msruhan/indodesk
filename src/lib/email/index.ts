import nodemailer from 'nodemailer'
import type Transporter from 'nodemailer/lib/mailer'
import { getSmtpRuntimeConfig } from '@/lib/smtp-settings'
import type { EmailPayload } from '@/lib/email/types'

export type { EmailPayload } from '@/lib/email/types'
export {
  buildEmailVerificationEmail,
  buildPasswordResetEmail,
  buildWithdrawOtpEmail,
  buildSuspiciousLoginEmail,
  buildSecurityAlertEmail,
  buildTeknisiApprovedEmail,
  buildTeknisiRejectedEmail,
  buildTeknisiRegistrationWelcomeEmail,
  buildUserRegistrationWelcomeEmail,
  buildSmtpTestEmail,
} from '@/lib/email/messages'

class ConsoleEmailService {
  async send(payload: EmailPayload): Promise<void> {
    const safePreview = redactSensitiveEmailContent(payload.text ?? payload.html)
    console.info('[email:console]', {
      to: payload.to,
      subject: redactSensitiveEmailContent(payload.subject),
      preview: safePreview.slice(0, 120),
    })
  }
}

function redactSensitiveEmailContent(text: string): string {
  return text
    .replace(/\b\d{6}\b/g, '[REDACTED_OTP]')
    .replace(/\b\d{4}-\d{4}\b/g, '[REDACTED_CODE]')
}

const consoleService = new ConsoleEmailService()

async function sendViaSmtp(
  cfg: NonNullable<Awaited<ReturnType<typeof getSmtpRuntimeConfig>>>,
  payload: EmailPayload,
): Promise<void> {
  const transporter: Transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure || cfg.port === 465,
    auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
  })

  await transporter.sendMail({
    from: cfg.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
}

/** Kirim email — memakai SMTP dari pengaturan admin; fallback ke console jika belum dikonfigurasi. */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const cfg = await getSmtpRuntimeConfig()
  if (!cfg) {
    await consoleService.send(payload)
    return
  }
  await sendViaSmtp(cfg, payload)
}
