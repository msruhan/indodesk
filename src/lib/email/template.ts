/** Warna & layout email — light theme, kompatibel klien email umum. */
import { BRAND_WORDMARK_SRC } from '@/components/brand/brand-logo'

export const EMAIL_THEME = {
  pageBg: '#f4f6f5',
  cardBg: '#ffffff',
  cardBorder: '#e4e7ec',
  headerGradient: 'linear-gradient(135deg, #059669 0%, #047857 55%, #0e7490 100%)',
  primary: '#059669',
  primaryDark: '#047857',
  accent: '#0891b2',
  ink: '#18181b',
  body: '#3f3f46',
  muted: '#71717a',
  subtle: '#a1a1aa',
  highlightBg: '#ecfdf5',
  highlightBorder: '#a7f3d0',
  warningBg: '#fffbeb',
  warningBorder: '#fde68a',
  dangerBg: '#fef2f2',
  dangerBorder: '#fecaca',
} as const

export type EmailTone = 'default' | 'warning' | 'danger'

export type EmailTemplateInput = {
  title: string
  preheader?: string
  greeting?: string
  paragraphs?: string[]
  bodyHtml?: string
  highlightHtml?: string
  /** Konten plain-text untuk highlight (OTP, detail login, dll.) */
  highlightText?: string
  tone?: EmailTone
  cta?: { label: string; href: string }
  secondaryLink?: { label: string; href: string }
  footerNote?: string
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function getEmailBrandName(): string {
  return process.env.NEXT_PUBLIC_PLATFORM_NAME?.trim() || 'Bandoo'
}

export function getEmailLogoUrl(): string {
  return `${getEmailAppUrl()}${BRAND_WORDMARK_SRC}`
}

export function getEmailAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

function toneBox(tone: EmailTone): { bg: string; border: string } {
  switch (tone) {
    case 'warning':
      return { bg: EMAIL_THEME.warningBg, border: EMAIL_THEME.warningBorder }
    case 'danger':
      return { bg: EMAIL_THEME.dangerBg, border: EMAIL_THEME.dangerBorder }
    default:
      return { bg: EMAIL_THEME.highlightBg, border: EMAIL_THEME.highlightBorder }
  }
}

function renderParagraphs(paragraphs: string[]): string {
  return paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${EMAIL_THEME.body};">${p}</p>`,
    )
    .join('')
}

function renderButton(href: string, label: string): string {
  const safeHref = escapeHtml(href)
  const safeLabel = escapeHtml(label)
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 8px;">
      <tr>
        <td align="center" style="border-radius:12px;background:${EMAIL_THEME.primary};">
          <a href="${safeHref}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;letter-spacing:0.01em;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>`
}

function renderSecondaryLink(href: string, label: string): string {
  const safeHref = escapeHtml(href)
  const safeLabel = escapeHtml(label)
  return `
    <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:${EMAIL_THEME.muted};text-align:center;">
      ${safeLabel}<br />
      <a href="${safeHref}" style="color:${EMAIL_THEME.primaryDark};word-break:break-all;">${safeHref}</a>
    </p>`
}

/** Bungkus konten email dalam layout light theme Bandoo. */
export function renderEmailDocument(input: EmailTemplateInput): { html: string; text: string } {
  const brand = getEmailBrandName()
  const appUrl = getEmailAppUrl()
  const logoUrl = getEmailLogoUrl()
  const year = new Date().getFullYear()
  const preheader = input.preheader ?? input.title
  const tone = toneBox(input.tone ?? 'default')

  const greeting = input.greeting
    ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${EMAIL_THEME.ink};font-weight:600;">${escapeHtml(input.greeting)}</p>`
    : ''

  const highlight = input.highlightHtml
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
        <tr>
          <td style="padding:16px 18px;border-radius:14px;background:${tone.bg};border:1px solid ${tone.border};">
            ${input.highlightHtml}
          </td>
        </tr>
      </table>`
    : ''

  const cta = input.cta ? renderButton(input.cta.href, input.cta.label) : ''
  const secondary = input.secondaryLink
    ? renderSecondaryLink(input.secondaryLink.href, input.secondaryLink.label)
    : ''

  const footerNote = input.footerNote
    ? `<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:${EMAIL_THEME.muted};">${escapeHtml(input.footerNote)}</p>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(input.title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-body { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_THEME.pageBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${EMAIL_THEME.pageBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-shell" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:0 0 20px;text-align:center;">
              <a href="${escapeHtml(appUrl)}" style="text-decoration:none;display:inline-block;">
                <img
                  src="${escapeHtml(logoUrl)}"
                  alt="${escapeHtml(brand)}"
                  width="200"
                  height="48"
                  style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;height:44px;width:auto;max-width:220px;"
                />
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:${EMAIL_THEME.cardBg};border:1px solid ${EMAIL_THEME.cardBorder};border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(24,24,27,0.06);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:4px;background:${EMAIL_THEME.headerGradient};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td class="email-body" style="padding:32px 36px 28px;">
                    <h1 style="margin:0 0 20px;font-size:22px;line-height:1.35;font-weight:700;color:${EMAIL_THEME.ink};letter-spacing:-0.02em;">
                      ${escapeHtml(input.title)}
                    </h1>
                    ${greeting}
                    ${renderParagraphs(input.paragraphs ?? [])}
                    ${input.bodyHtml ?? ''}
                    ${highlight}
                    ${cta}
                    ${secondary}
                    ${footerNote}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${EMAIL_THEME.muted};">
                Email ini dikirim oleh <strong style="color:${EMAIL_THEME.body};">${escapeHtml(brand)}</strong>
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:${EMAIL_THEME.subtle};">
                © ${year} ${escapeHtml(brand)} · <a href="${escapeHtml(appUrl)}" style="color:${EMAIL_THEME.primaryDark};text-decoration:none;">${escapeHtml(appUrl.replace(/^https?:\/\//, ''))}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const textParts = [
    input.greeting,
    ...(input.paragraphs ?? []),
    input.highlightText,
    input.cta ? `${input.cta.label}: ${input.cta.href}` : '',
    input.secondaryLink ? `${input.secondaryLink.label}: ${input.secondaryLink.href}` : '',
    input.footerNote ?? '',
    `— ${brand}`,
    appUrl,
  ].filter(Boolean)

  return { html, text: textParts.join('\n\n') }
}

export function renderOtpBlock(code: string): string {
  const safe = escapeHtml(code)
  return `
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_THEME.primaryDark};">
      Kode OTP
    </p>
    <p style="margin:0;font-size:34px;line-height:1;font-weight:700;letter-spacing:0.28em;color:${EMAIL_THEME.ink};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
      ${safe}
    </p>`
}

export function renderKeyValueList(
  items: Array<{ label: string; value: string }>,
): string {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${EMAIL_THEME.muted};vertical-align:top;width:110px;">${escapeHtml(item.label)}</td>
          <td style="padding:6px 0;font-size:13px;color:${EMAIL_THEME.ink};vertical-align:top;">${escapeHtml(item.value)}</td>
        </tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`
}
