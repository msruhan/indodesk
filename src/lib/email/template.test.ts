import { describe, expect, it } from 'vitest'
import { buildEmailVerificationEmail, buildWithdrawOtpEmail } from '@/lib/email/messages'
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
})
