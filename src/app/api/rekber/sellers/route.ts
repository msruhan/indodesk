import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import {
  deriveRekberSellerType,
  rekberSellerTypeLabel,
  type RekberSellerOption,
} from '@/lib/rekber-seller-types'

export const dynamic = 'force-dynamic'

const MAX_SELLERS = 200

export async function GET(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const q = new URL(req.url).searchParams.get('q')?.trim()

  try {
    const rows = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ['USER', 'TEKNISI'] },
        id: { not: session.user.id },
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teknisiProfile: { select: { specialty: true } },
      },
      orderBy: [{ name: 'asc' }],
      take: MAX_SELLERS,
    })

    const items: RekberSellerOption[] = rows.map((row) => {
      const sellerType = deriveRekberSellerType(row.role)
      const specialty = row.teknisiProfile?.specialty[0]
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        sellerType,
        sellerTypeLabel: rekberSellerTypeLabel(sellerType),
        subtitle: sellerType === 'teknisi' ? (specialty ?? 'Teknisi') : 'Member',
      }
    })

    return apiSuccess(items)
  } catch (e) {
    console.error('[REKBER_SELLERS_GET]', e)
    return apiError('Gagal memuat daftar penjual', 500)
  }
}
