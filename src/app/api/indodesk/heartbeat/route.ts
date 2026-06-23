import { prisma } from '@/lib/db'
import { apiSuccess } from '@/lib/api-auth'
import { extractIndodeskDeviceToken } from '@/lib/indodesk-device-auth'
import { resolveIndodeskDevice } from '@/lib/indodesk-auth'
import { normalizeRustdeskIdForMatch } from '@/lib/indodesk-device'
import {
  buildIndodeskHeartbeatStatus,
  findUnlockEligibleSessionForDevice,
} from '@/lib/indodesk-session'

export const dynamic = 'force-dynamic'

/** POST /api/indodesk/heartbeat — kompatibel subset RustDesk hbbs heartbeat */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return apiSuccess('')
  }

  const token = extractIndodeskDeviceToken(req, body)
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

    const session = await findUnlockEligibleSessionForDevice(device)
    return apiSuccess(buildIndodeskHeartbeatStatus(session))
  } catch (e) {
    console.error('[INODESK_HEARTBEAT]', e)
    return apiSuccess('')
  }
}
