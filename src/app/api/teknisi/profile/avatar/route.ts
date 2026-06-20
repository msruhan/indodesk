import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { deleteAvatarFile, saveAvatarFile } from '@/lib/avatar-upload'
import { loadTeknisiAccountProfile } from '@/lib/teknisi-profile-serializer'

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

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true, teknisiProfile: true },
    })
    if (!existing?.teknisiProfile) {
      return apiError('Profil teknisi tidak ditemukan', 404)
    }

    const imageUrl = await saveAvatarFile(file, session.user.id)
    await deleteAvatarFile(existing.image)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    })

    const profile = await loadTeknisiAccountProfile(session.user.id)
    if (!profile) return apiError('Profil teknisi tidak ditemukan', 404)

    return apiSuccess(profile)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal mengunggah foto'
    console.error('[TEKNISI_PROFILE_AVATAR_POST]', e)
    return apiError(message, 500)
  }
}
