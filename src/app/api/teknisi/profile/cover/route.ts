import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { deleteProfileCover, saveProfileCover } from '@/lib/profile-cover-image'
import { serializeTeknisiAccountProfile } from '@/lib/teknisi-profile-serializer'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return apiError('File gambar wajib diunggah')
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { teknisiProfile: true },
    })
    if (!user?.teknisiProfile) {
      return apiError('Profil teknisi tidak ditemukan', 404)
    }

    const coverImage = await saveProfileCover(file, session.user.id)
    await deleteProfileCover(user.teknisiProfile.coverImage)

    const profile = await prisma.teknisiProfile.update({
      where: { userId: session.user.id },
      data: { coverImage },
    })

    return apiSuccess(serializeTeknisiAccountProfile(user, profile))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal mengunggah cover'
    console.error('[TEKNISI_PROFILE_COVER_POST]', e)
    return apiError(message, 500)
  }
}
