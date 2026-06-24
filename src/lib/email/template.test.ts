import { describe, expect, it } from 'vitest'
import {
  buildEmailVerificationEmail,
  buildTeknisiApprovedEmail,
  buildTeknisiRegistrationWelcomeEmail,
  buildTeknisiRejectedEmail,
  buildUserRegistrationWelcomeEmail,
  buildWithdrawOtpEmail,
} from '@/lib/email/messages'
import { escapeHtml, renderEmailDocument } from '@/lib/email/template'

describe('email template', () => {
  it('escapes HTML in user content', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    )
  })

  it('renders light-themed layout with CTA', () => {
    const { html, text } = renderEmailDocument({
      title: 'Judul Tes',
      greeting: 'Halo Pengguna,',
      paragraphs: ['Paragraf contoh.'],
      cta: { label: 'Klik Di Sini', href: 'https://example.com/verify' },
    })

    expect(html).toContain('background-color:#f4f6f5')
    expect(html).toContain('background:#ffffff')
    expect(html).toContain('/icon/iconbantootext.png')
    expect(html).toContain('width="440"')
    expect(html).toContain('class="email-logo"')
    expect(html).toContain('Judul Tes')
    expect(html).toContain('Klik Di Sini')
    expect(html).not.toContain('background-color:#000')
    expect(text).toContain('Klik Di Sini: https://example.com/verify')
  })

  it('builds verification email with branded subject', () => {
    const payload = buildEmailVerificationEmail('https://bantoo.in/api/auth/verify-email?token=abc')
    expect(payload.subject).toContain('Verifikasi email')
    expect(payload.html).toContain('Verifikasi Email Saya')
    expect(payload.html).toContain('token=abc')
  })

  it('builds withdraw OTP email with code block', () => {
    const payload = buildWithdrawOtpEmail({ code: '123456', amount: 50000, userName: 'Budi' })
    expect(payload.html).toContain('123456')
    expect(payload.html).toContain('Budi')
    expect(payload.text).toContain('123456')
  })

  it('builds teknisi approved email with login CTA', () => {
    const payload = buildTeknisiApprovedEmail({ name: 'Andi' })
    expect(payload.subject).toContain('disetujui')
    expect(payload.html).toContain('Andi')
    expect(payload.html).toContain('/login')
    expect(payload.text).toContain('Login ke Dashboard Teknisi')
  })

  it('builds teknisi rejected email with reason when provided', () => {
    const payload = buildTeknisiRejectedEmail({
      name: 'Budi',
      rejectionReason: 'Dokumen tidak lengkap',
    })
    expect(payload.subject).toContain('tidak disetujui')
    expect(payload.html).toContain('Dokumen tidak lengkap')
    expect(payload.text).toContain('Alasan penolakan: Dokumen tidak lengkap')
  })

  it('builds user registration welcome email with verify step', () => {
    const payload = buildUserRegistrationWelcomeEmail({ name: 'Siti' })
    expect(payload.subject).toContain('Pendaftaran berhasil')
    expect(payload.html).toContain('Siti')
    expect(payload.html).toContain('verifikasi')
    expect(payload.html).toContain('/login')
  })

  it('builds teknisi registration welcome email with admin review notice', () => {
    const payload = buildTeknisiRegistrationWelcomeEmail({ name: 'Andi' })
    expect(payload.subject).toContain('Pendaftaran teknisi diterima')
    expect(payload.html).toContain('Andi')
    expect(payload.html).toContain('peninjauan')
    expect(payload.text).toContain('menunggu persetujuan')
  })
})
