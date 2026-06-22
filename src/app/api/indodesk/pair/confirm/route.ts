import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { consumeIndodeskPairingCode } from '@/lib/indodesk-auth'
import { normalizeRustdeskIdForMatch } from '@/lib/indodesk-device'
import {
  generateIndodeskDeviceToken,
  hashIndodeskDeviceToken,
} from '@/lib/indodesk-device-token'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  code: z.string().length(6),
  rustdeskId: z.string().min(6).max(32),
  deviceUuid: z.string().min(8).max(256),
  platform: z.string().max(64).optional(),
})

/** POST /api/indodesk/pair/confirm — dipanggil dari IndoDesk client */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const pairing = await consumeIndodeskPairingCode(parsed.data.code)
  if (!pairing) {
    return apiError('Kode pairing tidak valid atau sudah kedaluwarsa', 400)
  }

  const rustdeskId = normalizeRustdeskIdForMatch(parsed.data.rustdeskId)
  const deviceToken = generateIndodeskDeviceToken()
  const tokenHash = hashIndodeskDeviceToken(deviceToken)

  try {
    const device = await prisma.$transaction(async (tx) => {
      await tx.indodeskDevice.deleteMany({
        where: {
          userId: pairing.userId,
          role: pairing.role,
          rustdeskId,
        },
      })

      return tx.indodeskDevice.create({
        data: {
          userId: pairing.userId,
          role: pairing.role,
          rustdeskId,
          deviceUuid: parsed.data.deviceUuid,
          platform: parsed.data.platform?.trim() || null,
          tokenHash,
        },
      })
    })

    return apiSuccess({
      deviceToken,
      deviceId: device.id,
      role: pairing.role === 'USER' ? 'user' : 'teknisi',
    })
  } catch (e) {
    console.error('[INODESK_PAIR_CONFIRM]', e)
    return apiError('Gagal menghubungkan perangkat', 500)
  }
}
