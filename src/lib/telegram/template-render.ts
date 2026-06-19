const PLACEHOLDER_RE = /\{\{([a-zA-Z0-9_]+)\}\}/g

/** Label tombol untuk placeholder URL — dirender sebagai [label](url) di Telegram Markdown. */
const MARKDOWN_LINK_LABELS: Record<string, string> = {
  linkProduk: 'LINK PRODUK',
  linkPesanan: 'LIHAT PESANAN',
  linkDashboard: 'BUKA DASHBOARD',
}

/** Escape dynamic values for Telegram legacy Markdown parse_mode. */
export function escapeTelegramMarkdown(value: string): string {
  return value.replace(/([_*`\[])/g, '\\$1')
}

/** URL aman di dalam tanda kurung Markdown Telegram. */
export function escapeTelegramMarkdownUrl(url: string): string {
  return url.trim().replace(/\)/g, '%29')
}

export function formatTelegramMarkdownLink(label: string, url: string): string {
  const safeLabel = label.replace(/[\[\]]/g, '')
  return `[${safeLabel}](${escapeTelegramMarkdownUrl(url)})`
}

export function renderTelegramTemplate(
  body: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return body.replace(PLACEHOLDER_RE, (_match, key: string) => {
    const raw = vars[key]
    if (raw === null || raw === undefined || raw === '') return ''

    const linkLabel = MARKDOWN_LINK_LABELS[key]
    if (linkLabel) {
      return formatTelegramMarkdownLink(linkLabel, String(raw))
    }

    return escapeTelegramMarkdown(String(raw))
  })
}
