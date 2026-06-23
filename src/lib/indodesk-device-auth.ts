import { resolveIndodeskDevice } from '@/lib/indodesk-auth'

export function extractIndodeskDeviceToken(req: Request, body?: Record<string, unknown>): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7).trim()
    if (token) return token
  }
  if (body) {
    const fromBody = body.deviceToken ?? body.device_token ?? body.bantoo_token
    if (typeof fromBody === 'string' && fromBody.trim()) return fromBody.trim()
  }
  return null
}

export async function requireIndodeskDevice(req: Request, body?: Record<string, unknown>) {
  const token = extractIndodeskDeviceToken(req, body)
  if (!token) {
    return { device: null, token: null, error: 'Token perangkat wajib' as const }
  }
  const device = await resolveIndodeskDevice(token)
  if (!device) {
    return { device: null, token, error: 'Perangkat belum terhubung ke akun Bantoo' as const }
  }
  return { device, token, error: null }
}
