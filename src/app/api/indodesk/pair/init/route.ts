import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  createIndodeskPairingCode,
} from '@/lib/indodesk-auth'
import { generateIndodeskPairingCode } from '@/lib/indodesk-device-token'
import { slugToIndodeskClientRole } from '@/lib/indodesk-device'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  role: z.enum(['user', 'teknisi']),
})

/** POST /api/indodesk/pair/init — buat kode pairing 6 digit (TTL 5 menit) */
export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['USER', 'TEKNISI'])
  if (error) return error

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

  const role = slugToIndodeskClientRole(parsed.data.role)
  if (!role) return apiError('Peran tidak valid')

  if (role === 'TEKNISI' && session.user.role !== 'TEKNISI') {
    return apiError('Hanya akun teknisi yang dapat mempair perangkat teknisi', 403)
  }

  try {
    await prisma.indodeskPairingCode.deleteMany({
      where: { userId: session.user.id, role },
    })

    let code = generateIndodeskPairingCode()
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.indodeskPairingCode.findUnique({ where: { code } })
      if (!exists) break
      code = generateIndodeskPairingCode()
    }

    const row = await createIndodeskPairingCode(session.user.id, role, code)
    return apiSuccess({
      code: row.code,
      role: parsed.data.role,
      expiresAt: row.expiresAt.toISOString(),
    })
  } catch (e) {
    console.error('[INODESK_PAIR_INIT]', e)
    return apiError('Gagal membuat kode pairing', 500)
  }
}
