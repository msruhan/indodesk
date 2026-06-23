import { apiError, apiSuccess } from '@/lib/api-auth'
import {
  createIndodeskSessionGrant,
  resolveIndodeskDevice,
} from '@/lib/indodesk-auth'
import { requireIndodeskDevice } from '@/lib/indodesk-device-auth'
import {
  buildIndodeskSessionPreflight,
  findUnlockEligibleSessionForDevice,
} from '@/lib/indodesk-session'

export const dynamic = 'force-dynamic'

/** GET /api/indodesk/session/preflight — cek apakah sesi remote bisa di-unlock */
export async function GET(req: Request) {
  const { device, error } = await requireIndodeskDevice(req)
  if (error || !device) {
    return apiError(error ?? 'Perangkat tidak valid', 401)
  }

  try {
    const session = await findUnlockEligibleSessionForDevice(device)
    return apiSuccess(buildIndodeskSessionPreflight(session))
  } catch (e) {
    console.error('[INODESK_PREFLIGHT]', e)
    return apiError('Gagal memeriksa sesi', 500)
  }
}
