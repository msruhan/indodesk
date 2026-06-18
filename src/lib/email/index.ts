import nodemailer from 'nodemailer'
import type Transporter from 'nodemailer/lib/mailer'
import { getSmtpRuntimeConfig } from '@/lib/smtp-settings'

export type EmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
}

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

export function buildPasswordResetEmail(resetUrl: string): EmailPayload {
  return {
    to: '',
    subject: 'Reset password IndoTeknizi',
    html: `<p>Klik tautan berikut untuk reset password (berlaku 30 menit):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    text: `Reset password: ${resetUrl} (berlaku 30 menit)`,
  }
}

export function buildWithdrawOtpEmail(opts: {
  code: string
  amount?: number
  userName?: string | null
}): EmailPayload {
  const greeting = opts.userName ? `Halo ${opts.userName},` : 'Halo,'
  const amountLine = opts.amount
    ? `<p>Nominal penarikan: <strong>Rp ${opts.amount.toLocaleString('id-ID')}</strong></p>`
    : ''
  const html = `
    <p>${greeting}</p>
    <p>Gunakan kode OTP berikut untuk mengonfirmasi penarikan saldo IndoTeknizi:</p>
    <p style="font-size:28px;font-weight:bold;letter-spacing:4px;margin:16px 0">${opts.code}</p>
    ${amountLine}
    <p>Kode berlaku <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapa pun.</p>
    <p style="color:#666;font-size:12px">Jika Anda tidak meminta penarikan, abaikan email ini dan segera ubah password akun.</p>
  `
  const text = [
    greeting,
    `Kode OTP penarikan saldo: ${opts.code}`,
    opts.amount ? `Nominal: Rp ${opts.amount.toLocaleString('id-ID')}` : '',
    'Berlaku 10 menit. Jangan bagikan kode ini.',
  ]
    .filter(Boolean)
    .join('\n')

  return {
    to: '',
    subject: 'Kode OTP penarikan saldo IndoTeknizi',
    html,
    text,
  }
}
