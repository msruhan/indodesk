import 'server-only'

import { randomBytes } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { saveImage } from '@/lib/media-storage'
import { validateCertificationUpload } from '@/lib/certification-upload-validate'
import { putPublicObject, isR2Configured } from '@/lib/r2-storage'
import { TEKNISI_POST_UPLOAD_PREFIX } from '@/lib/teknisi-post'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_PDF_BYTES = 8 * 1024 * 1024
const FOLDER = 'teknisi-posts'

export type SavedTeknisiPostFile = {
  url: string
  type: 'image' | 'pdf'
  fileName: string
  mimeType: string
  sizeBytes: number
}

export async function saveTeknisiPostImage(file: File, userId: string): Promise<SavedTeknisiPostFile> {
  const url = await saveImage({
    folder: FOLDER,
    localUrlPrefix: TEKNISI_POST_UPLOAD_PREFIX,
    file,
    ownerId: userId,
    maxBytes: MAX_IMAGE_BYTES,
  })

  return {
    url,
    type: 'image',
    fileName: file.name || 'image',
    mimeType: file.type || 'image/jpeg',
    sizeBytes: file.size,
  }
}

export async function saveTeknisiPostPdf(file: File, userId: string): Promise<SavedTeknisiPostFile> {
  const raw = Buffer.from(await file.arrayBuffer())
  const validated = await validateCertificationUpload(raw, MAX_PDF_BYTES)
  if (validated.fileType !== 'pdf') {
    throw new Error('Hanya file PDF yang diizinkan')
  }

  const filename = `${userId}-${randomBytes(8).toString('hex')}.pdf`

  if (isR2Configured()) {
    const key = `${FOLDER}/${filename}`
    const publicUrl = await putPublicObject(key, raw, validated.mime)
    return {
      url: publicUrl,
      type: 'pdf',
      fileName: file.name || 'dokumen.pdf',
      mimeType: validated.mime,
      sizeBytes: raw.length,
    }
  }

  const localDir = path.join(process.cwd(), 'public', 'uploads', FOLDER)
  await mkdir(localDir, { recursive: true })
  await writeFile(path.join(localDir, filename), raw)

  return {
    url: `${TEKNISI_POST_UPLOAD_PREFIX}${filename}`,
    type: 'pdf',
    fileName: file.name || 'dokumen.pdf',
    mimeType: validated.mime,
    sizeBytes: raw.length,
  }
}
