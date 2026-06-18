import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { saveInspectionPhoto } from '@/lib/inspection-image-server'
import { MagicByteError } from '@/lib/uploads/validate'

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

    const imageUrl = await saveInspectionPhoto(file, session.user.id)
    return apiSuccess({ imageUrl })
  } catch (e) {
    if (e instanceof MagicByteError) {
      return apiError(e.message, 415)
    }
    const message = e instanceof Error ? e.message : 'Gagal mengunggah foto'
    console.error('[TEKNISI_INSPEKSI_UPLOAD_POST]', e)
    return apiError(message, 500)
  }
}
