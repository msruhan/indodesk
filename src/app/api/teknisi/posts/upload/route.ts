import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { saveTeknisiPostImage, saveTeknisiPostPdf } from '@/lib/teknisi-post-upload-server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const kind = String(formData.get('kind') ?? 'image')

    if (!(file instanceof File)) {
      return apiError('File wajib diunggah')
    }

    if (kind === 'pdf') {
      const saved = await saveTeknisiPostPdf(file, session.user.id)
      return apiSuccess(saved)
    }

    const saved = await saveTeknisiPostImage(file, session.user.id)
    return apiSuccess(saved)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal mengunggah file'
    console.error('[TEKNISI_POST_UPLOAD_POST]', e)
    return apiError(message, 500)
  }
}
