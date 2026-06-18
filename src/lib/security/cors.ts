import { getAllowedOrigins, requestOriginAllowed } from '@/lib/security/origins'

export function corsHeadersForRequest(req: Request): Record<string, string> {
  const origin = req.headers.get('origin')
  if (!origin) return {}

  const allowlist = getAllowedOrigins()
  if (!requestOriginAllowed(origin, allowlist)) return {}

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  }
}
