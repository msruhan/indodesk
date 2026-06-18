export const CSP_NONCE_HEADER = 'x-csp-nonce'
export const REQUEST_METHOD_HEADER = 'x-request-method'
export const REQUEST_PATHNAME_HEADER = 'x-request-pathname'

export function generateCspNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function cspEnforced(): boolean {
  if (process.env.CSP_ENFORCE === 'false') return false
  if (process.env.NODE_ENV === 'production') return true
  return process.env.CSP_ENFORCE === 'true'
}

export function buildSecurityHeaders(pathname: string, nonce: string): Record<string, string> {
  const isProd = process.env.NODE_ENV === 'production'
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  const cspHeader = cspEnforced()
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only'

  const headers: Record<string, string> = {
    [cspHeader]: csp,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    [CSP_NONCE_HEADER]: nonce,
  }

  if (isProd) {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
  }

  if (isAdmin) {
    headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
  }

  return headers
}

/** Forward nonce + request metadata for Server Components / API auth guards. */
export function withSecurityRequestHeaders(
  req: Request,
  pathname: string,
  nonce: string,
): Headers {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set(CSP_NONCE_HEADER, nonce)
  requestHeaders.set(REQUEST_METHOD_HEADER, req.method)
  requestHeaders.set(REQUEST_PATHNAME_HEADER, pathname)
  return requestHeaders
}

export function applySecurityHeadersToResponse(
  response: Response,
  pathname: string,
  nonce: string,
): Response {
  const headers = buildSecurityHeaders(pathname, nonce)
  const next = new Headers(response.headers)
  for (const [key, value] of Object.entries(headers)) {
    next.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: next,
  })
}
