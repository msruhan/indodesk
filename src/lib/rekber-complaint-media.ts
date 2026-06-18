import 'server-only'

import { processUpload } from '@/lib/uploads/pipeline'
import {
  REKBER_COMPLAINT_PHOTO_MAX,
  REKBER_COMPLAINT_VIDEO_MAX,
} from '@/lib/validations/rekber-complaint'
import type { OrderComplaintMediaType } from '@prisma/client'
import { randomBytes } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileTypeFromBuffer } from 'file-type'
import { privateObjectKey, uploadToPrivateR2 } from '@/lib/uploads/r2-private'
import { isR2Configured } from '@/lib/r2-storage'

const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

async function uploadRekberComplaintVideo(
  rekberId: string,
  ownerId: string,
  file: File,
): Promise<{ url: string; mimeType: string; sizeBytes: number }> {
  const raw = Buffer.from(await file.arrayBuffer())
  if (raw.length === 0) throw new Error('Video kosong')
  if (raw.length > REKBER_COMPLAINT_VIDEO_MAX) {
    throw new Error('Ukuran video maksimal 50 MB')
  }

  const detected = await fileTypeFromBuffer(raw)
  if (!detected?.mime || !VIDEO_MIMES.has(detected.mime)) {
    throw new Error('Format video tidak diizinkan (MP4, WebM, MOV)')
  }

  const filename = `${ownerId}-${randomBytes(8).toString('hex')}.${detected.ext}`
  const folder = `rekber-complaints/${rekberId}`

  if (isR2Configured()) {
    const key = privateObjectKey(folder, filename)
    await uploadToPrivateR2(key, raw, detected.mime)
    return {
      url: `/api/media/private/${folder}/${filename}`,
      mimeType: detected.mime,
      sizeBytes: raw.length,
    }
  }

  const localDir = path.join(process.cwd(), 'public', 'uploads', 'private', folder)
  await mkdir(localDir, { recursive: true })
  await writeFile(path.join(localDir, filename), raw)
  return {
    url: `/api/media/private/local/${folder}/${filename}`,
    mimeType: detected.mime,
    sizeBytes: raw.length,
  }
}

export async function uploadRekberComplaintMediaFiles(
  rekberId: string,
  ownerId: string,
  defectPhotos: File[],
  unboxingVideos: File[],
): Promise<
  Array<{ type: OrderComplaintMediaType; url: string; mimeType: string; sizeBytes: number }>
> {
  const results: Array<{
    type: OrderComplaintMediaType
    url: string
    mimeType: string
    sizeBytes: number
  }> = []

  for (const file of defectPhotos) {
    const uploaded = await processUpload({
      folder: `rekber-complaints/${rekberId}`,
      ownerId,
      file,
      maxBytes: REKBER_COMPLAINT_PHOTO_MAX,
      visibility: 'private',
      localUrlPrefix: `/api/media/private/local/rekber-complaints/${rekberId}`,
    })
    results.push({
      type: 'DEFECT_PHOTO',
      url: uploaded.url,
      mimeType: uploaded.contentType,
      sizeBytes: file.size,
    })
  }

  for (const file of unboxingVideos) {
    const uploaded = await uploadRekberComplaintVideo(rekberId, ownerId, file)
    results.push({ type: 'UNBOXING_VIDEO', ...uploaded })
  }

  return results
}
