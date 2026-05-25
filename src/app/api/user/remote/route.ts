import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { serializeUserRemote, type TeknisiParty } from '@/lib/user-remote-serializer'

export const dynamic = 'force-dynamic'

const TEKNISI_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} satisfies Record<keyof TeknisiParty, true>

export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const rows = await prisma.remoteSession.findMany({
      where: { userId: session.user.id },
      include: { teknisi: { select: TEKNISI_SELECT } },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(rows.map(serializeUserRemote))
  } catch (e) {
    console.error('[USER_REMOTE_GET]', e)
    return apiError('Gagal memuat riwayat remote', 500)
  }
}
