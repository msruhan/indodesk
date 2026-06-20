import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { serializeUserProfile } from '@/lib/user-profile-serializer'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(120).optional(),
  phone: z.string().max(30).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  shippingCityId: z.string().max(64).nullable().optional(),
  shippingCityLabel: z.string().max(200).nullable().optional(),
  shippingDistrictId: z.string().max(64).nullable().optional(),
  shippingDistrictLabel: z.string().max(200).nullable().optional(),
  shippingLocationId: z.string().max(64).nullable().optional(),
  shippingLocationLabel: z.string().max(200).nullable().optional(),
  shippingStreet: z.string().max(300).nullable().optional(),
})

export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!user) return apiError('User tidak ditemukan', 404)

    const googleAccount = await prisma.account.findFirst({
      where: { userId: user.id, provider: 'google' },
      select: { id: true },
    })

    return apiSuccess(serializeUserProfile(user, { googleLinked: Boolean(googleAccount) }))
  } catch (e) {
    console.error('[USER_PROFILE_GET]', e)
    return apiError('Gagal mengambil profil', 500)
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const { name, phone, address, ...shippingFields } = parsed.data
    if (
      name === undefined &&
      phone === undefined &&
      address === undefined &&
      Object.keys(shippingFields).length === 0
    ) {
      return apiError('Tidak ada data yang diubah')
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        ...shippingFields,
      },
    })

    const googleAccount = await prisma.account.findFirst({
      where: { userId: user.id, provider: 'google' },
      select: { id: true },
    })

    return apiSuccess(serializeUserProfile(user, { googleLinked: Boolean(googleAccount) }))
  } catch (e) {
    console.error('[USER_PROFILE_PATCH]', e)
    return apiError('Gagal memperbarui profil', 500)
  }
}
