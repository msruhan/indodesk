const PLACEHOLDER_RE = /\{\{([a-zA-Z0-9_]+)\}\}/g

/** Escape dynamic values for Telegram legacy Markdown parse_mode. */
export function escapeTelegramMarkdown(value: string): string {
  return value.replace(/([_*`\[])/g, '\\$1')
}

export function renderTelegramTemplate(
  body: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return body.replace(PLACEHOLDER_RE, (_match, key: string) => {
    const raw = vars[key]
    if (raw === null || raw === undefined || raw === '') return ''
    return escapeTelegramMarkdown(String(raw))
  })
}
