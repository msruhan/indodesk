import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { resolveIndodeskDevice } from '@/lib/indodesk-auth'
import { normalizeRustdeskIdForMatch } from '@/lib/indodesk-device'

export const dynamic = 'force-dynamic'

function extractDeviceToken(req: Request, body: Record<string, unknown>): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7).trim() || null
  }
  const fromBody = body.deviceToken ?? body.device_token ?? body.bantoo_token
  if (typeof fromBody === 'string' && fromBody.trim()) return fromBody.trim()
  return null
}

/** POST /api/indodesk/heartbeat — kompatibel subset RustDesk hbbs heartbeat */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return apiSuccess('')
  }

  const token = extractDeviceToken(req, body)
  if (!token) {
    return apiSuccess('')
  }

  try {
    const device = await resolveIndodeskDevice(token)
    if (!device) {
      return apiSuccess('')
    }

    const rustdeskId =
      typeof body.id === 'string' ? normalizeRustdeskIdForMatch(body.id) : device.rustdeskId

    await prisma.indodeskDevice.update({
      where: { id: device.id },
      data: {
        lastSeenAt: new Date(),
        ...(rustdeskId !== device.rustdeskId ? { rustdeskId } : {}),
      },
    })

    return apiSuccess('')
  } catch (e) {
    console.error('[INODESK_HEARTBEAT]', e)
    return apiSuccess('')
  }
}
