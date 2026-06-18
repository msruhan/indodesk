import type { EmailPayload } from '@/lib/email/types'
import {
  escapeHtml,
  getEmailAppUrl,
  getEmailBrandName,
  renderEmailDocument,
  renderKeyValueList,
  renderOtpBlock,
} from '@/lib/email/template'

export function buildEmailVerificationEmail(verifyUrl: string): Omit<EmailPayload, 'to'> {
  const brand = getEmailBrandName()
  const doc = renderEmailDocument({
    title: 'Verifikasi alamat email Anda',
    preheader: `Konfirmasi email untuk mengaktifkan akun ${brand} Anda.`,
    greeting: 'Halo,',
    paragraphs: [
      `Terima kasih telah mendaftar di ${brand}. Untuk mengaktifkan akun dan mulai menggunakan layanan, silakan verifikasi alamat email Anda.`,
      'Tautan verifikasi berlaku selama 24 jam. Jika Anda tidak mendaftar, abaikan email ini.',
    ],
    cta: { label: 'Verifikasi Email Saya', href: verifyUrl },
    secondaryLink: {
      label: 'Tombol tidak berfungsi? Salin tautan berikut ke browser:',
      href: verifyUrl,
    },
    footerNote: 'Demi keamanan, jangan bagikan tautan ini kepada siapa pun.',
  })
  return {
    subject: `Verifikasi email — ${brand}`,
    html: doc.html,
    text: doc.text,
  }
}

export function buildPasswordResetEmail(resetUrl: string): Omit<EmailPayload, 'to'> {
  const brand = getEmailBrandName()
  const doc = renderEmailDocument({
    title: 'Reset password',
    preheader: `Permintaan reset password untuk akun ${brand} Anda.`,
    greeting: 'Halo,',
    paragraphs: [
      'Kami menerima permintaan untuk mengatur ulang password akun Anda. Klik tombol di bawah untuk membuat password baru.',
      'Tautan ini berlaku selama 30 menit dan hanya dapat digunakan satu kali.',
    ],
    cta: { label: 'Atur Ulang Password', href: resetUrl },
    secondaryLink: {
      label: 'Tombol tidak berfungsi? Salin tautan berikut:',
      href: resetUrl,
    },
    tone: 'warning',
    footerNote:
      'Jika Anda tidak meminta reset password, abaikan email ini — password Anda tidak akan berubah.',
  })
  return {
    subject: `Reset password — ${brand}`,
    html: doc.html,
    text: doc.text,
  }
}

export function buildWithdrawOtpEmail(opts: {
  code: string
  amount?: number
  userName?: string | null
}): Omit<EmailPayload, 'to'> {
  const brand = getEmailBrandName()
  const greeting = opts.userName ? `Halo ${opts.userName},` : 'Halo,'
  const amountLine =
    opts.amount != null
      ? `<p style="margin:12px 0 0;font-size:14px;color:#3f3f46;">Nominal penarikan: <strong style="color:#047857;">Rp ${escapeHtml(opts.amount.toLocaleString('id-ID'))}</strong></p>`
      : ''

  const amountText =
    opts.amount != null ? `Nominal penarikan: Rp ${opts.amount.toLocaleString('id-ID')}` : ''

  const doc = renderEmailDocument({
    title: 'Kode OTP penarikan saldo',
    preheader: `Kode OTP untuk konfirmasi penarikan saldo ${brand}.`,
    greeting,
    paragraphs: [
      'Gunakan kode OTP berikut untuk mengonfirmasi permintaan penarikan saldo dari dompet Anda.',
      'Kode berlaku 10 menit. Jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari tim support.',
    ],
    highlightHtml: `${renderOtpBlock(opts.code)}${amountLine}`,
    highlightText: [`Kode OTP: ${opts.code}`, amountText].filter(Boolean).join('\n'),
    tone: 'warning',
    footerNote:
      'Jika Anda tidak meminta penarikan, segera ubah password akun dan hubungi dukungan.',
  })
  return {
    subject: `Kode OTP penarikan saldo — ${brand}`,
    html: doc.html,
    text: doc.text,
  }
}

export function buildSuspiciousLoginEmail(opts: {
  name: string | null
  email: string
  ip?: string | null
  userAgent?: string | null
}): Omit<EmailPayload, 'to'> {
  const brand = getEmailBrandName()
  const settingsUrl = `${getEmailAppUrl()}/user/settings`
  const doc = renderEmailDocument({
    title: 'Login dari perangkat baru',
    preheader: `Aktivitas login baru terdeteksi pada akun ${brand} Anda.`,
    greeting: opts.name ? `Halo ${opts.name},` : 'Halo,',
    paragraphs: [
      'Kami mendeteksi login ke akun Anda dari perangkat atau lokasi yang belum pernah digunakan sebelumnya.',
      'Jika ini memang Anda, tidak ada tindakan yang diperlukan. Jika bukan Anda, segera amankan akun dengan mengganti password.',
    ],
    highlightHtml: renderKeyValueList([
      { label: 'Akun', value: opts.email },
      { label: 'Alamat IP', value: opts.ip?.trim() || 'Tidak diketahui' },
      { label: 'Perangkat', value: opts.userAgent?.trim() || 'Tidak diketahui' },
    ]),
    highlightText: [
      `Akun: ${opts.email}`,
      `Alamat IP: ${opts.ip?.trim() || 'Tidak diketahui'}`,
      `Perangkat: ${opts.userAgent?.trim() || 'Tidak diketahui'}`,
    ].join('\n'),
    cta: { label: 'Buka Pengaturan Keamanan', href: settingsUrl },
    tone: 'danger',
    footerNote: 'Pertimbangkan untuk mengaktifkan autentikasi dua faktor (2FA) di menu Profil.',
  })
  return {
    subject: `Login dari perangkat baru — ${brand}`,
    html: doc.html,
    text: doc.text,
  }
}

export function buildSecurityAlertEmail(opts: {
  title: string
  body: string
}): Omit<EmailPayload, 'to'> {
  const brand = getEmailBrandName()
  const adminUrl = `${getEmailAppUrl()}/admin/dashboard`
  const doc = renderEmailDocument({
    title: opts.title,
    preheader: `Peringatan keamanan ${brand}: ${opts.title}`,
    greeting: 'Halo Admin,',
    paragraphs: [opts.body, 'Segera tinjau log aktivitas dan panel keamanan saldo di dashboard admin.'],
    cta: { label: 'Buka Dashboard Admin', href: adminUrl },
    tone: 'danger',
  })
  return {
    subject: `[Keamanan ${brand}] ${opts.title}`,
    html: doc.html,
    text: doc.text,
  }
}

export function buildSmtpTestEmail(host: string): Omit<EmailPayload, 'to'> {
  const brand = getEmailBrandName()
  const doc = renderEmailDocument({
    title: 'Tes konfigurasi SMTP',
    preheader: `Email uji coba dari panel admin ${brand}.`,
    greeting: 'Halo Admin,',
    paragraphs: [
      'Email ini dikirim untuk memverifikasi bahwa pengaturan SMTP di panel admin sudah benar.',
      'Jika Anda menerima pesan ini di inbox, server SMTP siap digunakan untuk verifikasi akun, reset password, OTP, dan notifikasi lainnya.',
    ],
    highlightHtml: renderKeyValueList([{ label: 'SMTP Host', value: host }]),
    highlightText: `SMTP Host: ${host}`,
    tone: 'default',
  })
  return {
    subject: `Tes SMTP — ${brand}`,
    html: doc.html,
    text: doc.text,
  }
}
