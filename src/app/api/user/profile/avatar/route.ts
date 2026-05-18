import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { deleteAvatarFile, saveAvatarFile } from '@/lib/avatar-upload'
import { serializeUserProfile } from '@/lib/user-profile-serializer'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return apiError('File gambar wajib diunggah')
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    })
    if (!existing) return apiError('User tidak ditemukan', 404)

    const imageUrl = await saveAvatarFile(file, session.user.id)
    await deleteAvatarFile(existing.image)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    })

    return apiSuccess(serializeUserProfile(user))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal mengunggah foto'
    console.error('[USER_PROFILE_AVATAR_POST]', e)
    return apiError(message, 500)
  }
}
