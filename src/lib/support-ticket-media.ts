import 'server-only'

import { randomBytes } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileTypeFromBuffer } from 'file-type'
import type { SupportTicketMediaKind } from '@prisma/client'
import { processUpload } from '@/lib/uploads/pipeline'
import { privateObjectKey, uploadToPrivateR2 } from '@/lib/uploads/r2-private'
import { isR2Configured } from '@/lib/r2-storage'
import {
  SUPPORT_TICKET_MAX_FILES,
  SUPPORT_TICKET_PHOTO_MAX,
  SUPPORT_TICKET_VIDEO_MAX,
} from '@/lib/support-ticket-constants'

const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

async function uploadTicketVideo(
  ticketId: string,
  ownerId: string,
  file: File,
): Promise<{ kind: SupportTicketMediaKind; url: string; mimeType: string; sizeBytes: number; fileName: string }> {
  const raw = Buffer.from(await file.arrayBuffer())
  if (raw.length === 0) throw new Error('Video kosong')
  if (raw.length > SUPPORT_TICKET_VIDEO_MAX) {
    throw new Error('Ukuran video maksimal 50 MB')
  }

  const detected = await fileTypeFromBuffer(raw)
  if (!detected?.mime || !VIDEO_MIMES.has(detected.mime)) {
    throw new Error('Format video tidak diizinkan (MP4, WebM, MOV)')
  }

  const filename = `${ownerId}-${randomBytes(8).toString('hex')}.${detected.ext}`
  const folder = `tickets/${ticketId}`

  if (isR2Configured()) {
    const key = privateObjectKey(folder, filename)
    await uploadToPrivateR2(key, raw, detected.mime)
    return {
      kind: 'VIDEO',
      url: `/api/media/private/${folder}/${filename}`,
      mimeType: detected.mime,
      sizeBytes: raw.length,
      fileName: file.name || filename,
    }
  }

  const localDir = path.join(process.cwd(), 'public', 'uploads', 'private', folder)
  await mkdir(localDir, { recursive: true })
  await writeFile(path.join(localDir, filename), raw)
  return {
    kind: 'VIDEO',
    url: `/api/media/private/local/${folder}/${filename}`,
    mimeType: detected.mime,
    sizeBytes: raw.length,
    fileName: file.name || filename,
  }
}

export async function uploadSupportTicketMediaFiles(
  ticketId: string,
  ownerId: string,
  files: File[],
): Promise<
  Array<{
    kind: SupportTicketMediaKind
    url: string
    mimeType: string
    sizeBytes: number
    fileName: string
  }>
> {
  if (files.length > SUPPORT_TICKET_MAX_FILES) {
    throw new Error(`Maksimal ${SUPPORT_TICKET_MAX_FILES} file per unggahan`)
  }

  const results: Array<{
    kind: SupportTicketMediaKind
    url: string
    mimeType: string
    sizeBytes: number
    fileName: string
  }> = []

  for (const file of files) {
    const mime = file.type || ''
    if (mime.startsWith('video/')) {
      results.push(await uploadTicketVideo(ticketId, ownerId, file))
      continue
    }

    const uploaded = await processUpload({
      folder: `tickets/${ticketId}`,
      ownerId,
      file,
      maxBytes: SUPPORT_TICKET_PHOTO_MAX,
      visibility: 'private',
      localUrlPrefix: `/api/media/private/local/tickets/${ticketId}`,
    })
    results.push({
      kind: 'IMAGE',
      url: uploaded.url,
      mimeType: uploaded.contentType,
      sizeBytes: file.size,
      fileName: file.name || 'lampiran',
    })
  }

  return results
}
