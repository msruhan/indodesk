/** Shared Origin allowlist for CSRF and CORS. */

function isLocalDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

/** Loopback origins (localhost / 127.0.0.1, any port) — safe for CSRF; browsers cannot forge these from external sites. */
export function isLoopbackOrigin(value: string): boolean {
  try {
    return isLocalDevHost(new URL(value).hostname)
  } catch {
    return false
  }
}

/** @deprecated Use isLoopbackOrigin */
export function isLocalDevOrigin(value: string): boolean {
  return isLoopbackOrigin(value)
}

export function getAllowedOrigins(): string[] {
  const list = new Set<string>()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (appUrl) {
    try {
      list.add(new URL(appUrl).origin)
    } catch {
      /* ignore */
    }
  }

  const cors = process.env.CORS_ALLOWED_ORIGINS?.trim()
  if (cors) {
    for (const part of cors.split(',')) {
      const o = part.trim()
      if (!o) continue
      try {
        list.add(new URL(o).origin)
      } catch {
        list.add(o)
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    list.add('http://localhost:3000')
    list.add('http://127.0.0.1:3000')
  }

  return [...list]
}

export function originMatchesAllowlist(value: string | null, allowlist: string[]): boolean {
  if (!value) return false
  if (isLoopbackOrigin(value)) return true
  try {
    const origin = new URL(value).origin
    return allowlist.includes(origin)
  } catch {
    return allowlist.some((a) => value.startsWith(a))
  }
}

export function requestOriginAllowed(origin: string | null, allowlist: string[]): boolean {
  return originMatchesAllowlist(origin, allowlist)
}
