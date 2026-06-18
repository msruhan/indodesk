/**
 * Render template notifikasi Telegram dengan placeholder {{key}}.
 */

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g

export function renderTelegramTemplate(
  body: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return body.replace(PLACEHOLDER_RE, (_match, key: string) => {
    const value = vars[key]
    if (value === null || value === undefined || value === '') {
      return '—'
    }
    return String(value)
  })
}

export function extractTelegramPlaceholders(body: string): string[] {
  const found = new Set<string>()
  for (const match of body.matchAll(PLACEHOLDER_RE)) {
    found.add(match[1])
  }
  return [...found]
}
