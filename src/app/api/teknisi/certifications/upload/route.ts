import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { saveCertificationFile } from '@/lib/certification-file-server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return apiError('File wajib diunggah')
    }

    const saved = await saveCertificationFile(file, session.user.id)
    return apiSuccess(saved)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal mengunggah file'
    console.error('[TEKNISI_CERTIFICATIONS_UPLOAD_POST]', e)
    return apiError(message, 500)
  }
}
