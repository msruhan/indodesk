import 'server-only'

import { randomBytes } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileTypeFromBuffer } from 'file-type'
import { processUpload } from '@/lib/uploads/pipeline'
import { privateObjectKey, uploadToPrivateR2 } from '@/lib/uploads/r2-private'
import { isR2Configured } from '@/lib/r2-storage'
import {
  MARKETPLACE_COMPLAINT_PHOTO_MAX,
  MARKETPLACE_COMPLAINT_VIDEO_MAX,
} from '@/lib/validations/marketplace-complaint'
import type { OrderComplaintMediaType } from '@prisma/client'

const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

async function uploadComplaintVideo(
  orderId: string,
  ownerId: string,
  file: File,
): Promise<{ url: string; mimeType: string; sizeBytes: number }> {
  const raw = Buffer.from(await file.arrayBuffer())
  if (raw.length === 0) throw new Error('Video kosong')
  if (raw.length > MARKETPLACE_COMPLAINT_VIDEO_MAX) {
    throw new Error('Ukuran video maksimal 50 MB')
  }

  const detected = await fileTypeFromBuffer(raw)
  if (!detected?.mime || !VIDEO_MIMES.has(detected.mime)) {
    throw new Error('Format video tidak diizinkan (MP4, WebM, MOV)')
  }

  const filename = `${ownerId}-${randomBytes(8).toString('hex')}.${detected.ext}`
  const folder = `complaints/${orderId}`

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

export async function uploadComplaintMediaFiles(
  orderId: string,
  ownerId: string,
  defectPhotos: File[],
  unboxingVideos: File[],
): Promise<Array<{ type: OrderComplaintMediaType; url: string; mimeType: string; sizeBytes: number }>> {
  const results: Array<{
    type: OrderComplaintMediaType
    url: string
    mimeType: string
    sizeBytes: number
  }> = []

  for (const file of defectPhotos) {
    const uploaded = await processUpload({
      folder: `complaints/${orderId}`,
      ownerId,
      file,
      maxBytes: MARKETPLACE_COMPLAINT_PHOTO_MAX,
      visibility: 'private',
      localUrlPrefix: `/api/media/private/local/complaints/${orderId}`,
    })
    results.push({
      type: 'DEFECT_PHOTO',
      url: uploaded.url,
      mimeType: uploaded.contentType,
      sizeBytes: file.size,
    })
  }

  for (const file of unboxingVideos) {
    const uploaded = await uploadComplaintVideo(orderId, ownerId, file)
    results.push({ type: 'UNBOXING_VIDEO', ...uploaded })
  }

  return results
}

/** @deprecated Use uploadComplaintMediaFiles with defectPhotos + unboxingVideos */
export async function uploadLegacyComplaintMediaFiles(
  orderId: string,
  ownerId: string,
  photos: File[],
  videos: File[],
): Promise<Array<{ type: OrderComplaintMediaType; url: string; mimeType: string; sizeBytes: number }>> {
  const results: Array<{
    type: OrderComplaintMediaType
    url: string
    mimeType: string
    sizeBytes: number
  }> = []

  for (const file of photos) {
    const uploaded = await processUpload({
      folder: `complaints/${orderId}`,
      ownerId,
      file,
      maxBytes: MARKETPLACE_COMPLAINT_PHOTO_MAX,
      visibility: 'private',
      localUrlPrefix: `/api/media/private/local/complaints/${orderId}`,
    })
    results.push({
      type: 'PHOTO',
      url: uploaded.url,
      mimeType: uploaded.contentType,
      sizeBytes: file.size,
    })
  }

  return results
}

export async function uploadReturnComplaintMediaFiles(
  orderId: string,
  ownerId: string,
  photos: File[],
  videos: File[],
  photoType: 'RETURN_PHOTO' | 'RETURN_REJECT_PHOTO' = 'RETURN_PHOTO',
): Promise<Array<{ type: OrderComplaintMediaType; url: string; mimeType: string; sizeBytes: number }>> {
  const results: Array<{
    type: OrderComplaintMediaType
    url: string
    mimeType: string
    sizeBytes: number
  }> = []

  for (const file of photos) {
    const uploaded = await processUpload({
      folder: `complaints/${orderId}`,
      ownerId,
      file,
      maxBytes: MARKETPLACE_COMPLAINT_PHOTO_MAX,
      visibility: 'private',
      localUrlPrefix: `/api/media/private/local/complaints/${orderId}`,
    })
    results.push({
      type: photoType,
      url: uploaded.url,
      mimeType: uploaded.contentType,
      sizeBytes: file.size,
    })
  }

  for (const file of videos) {
    const uploaded = await uploadComplaintVideo(orderId, ownerId, file)
    results.push({ type: 'RETURN_VIDEO', ...uploaded })
  }

  return results
}
