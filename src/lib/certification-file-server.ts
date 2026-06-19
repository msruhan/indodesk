import 'server-only'

import { randomBytes } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { deleteImage } from '@/lib/media-storage'
import { putPublicObject, isR2Configured } from '@/lib/r2-storage'
import { validateCertificationUpload } from '@/lib/certification-upload-validate'
import { CERTIFICATION_UPLOAD_PREFIX } from '@/lib/certification-file'
import { reencodeImage } from '@/lib/uploads/reencode'
import type { TeknisiCertificationFileType } from '@/lib/teknisi-certification'

const MAX_BYTES = 8 * 1024 * 1024

export type SavedCertificationFile = {
  fileUrl: string
  fileType: TeknisiCertificationFileType
}

export async function saveCertificationFile(
  file: File,
  userId: string,
): Promise<SavedCertificationFile> {
  const raw = Buffer.from(await file.arrayBuffer())
  const validated = await validateCertificationUpload(raw, MAX_BYTES)

  const filename = `${userId}-${randomBytes(8).toString('hex')}.${validated.ext}`
  const folder = 'teknisi-certifications'

  if (validated.fileType === 'image') {
    const encoded = await reencodeImage(raw, validated.mime)
    const imageFilename = `${userId}-${randomBytes(8).toString('hex')}.${encoded.ext}`

    if (isR2Configured()) {
      const key = `${folder}/${imageFilename}`
      const publicUrl = await putPublicObject(key, encoded.buffer, encoded.mime)
      return { fileUrl: publicUrl, fileType: 'image' }
    }

    const localDir = path.join(process.cwd(), 'public', 'uploads', folder)
    await mkdir(localDir, { recursive: true })
    await writeFile(path.join(localDir, imageFilename), encoded.buffer)
    return { fileUrl: `${CERTIFICATION_UPLOAD_PREFIX}${imageFilename}`, fileType: 'image' }
  }

  if (isR2Configured()) {
    const key = `${folder}/${filename}`
    const publicUrl = await putPublicObject(key, raw, validated.mime)
    return { fileUrl: publicUrl, fileType: 'pdf' }
  }

  const localDir = path.join(process.cwd(), 'public', 'uploads', folder)
  await mkdir(localDir, { recursive: true })
  await writeFile(path.join(localDir, filename), raw)
  return { fileUrl: `${CERTIFICATION_UPLOAD_PREFIX}${filename}`, fileType: 'pdf' }
}

export async function deleteCertificationFile(fileUrl: string | null | undefined): Promise<void> {
  await deleteImage(fileUrl, CERTIFICATION_UPLOAD_PREFIX)
}
