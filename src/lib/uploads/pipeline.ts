import 'server-only'

import { randomBytes } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { putPublicObject, isR2Configured } from '@/lib/r2-storage'
import { reencodeImage } from '@/lib/uploads/reencode'
import { privateObjectKey, uploadToPrivateR2 } from '@/lib/uploads/r2-private'
import { validateUpload } from '@/lib/uploads/validate'

export type UploadVisibility = 'public' | 'private'

export type ProcessUploadInput = {
  folder: string
  ownerId: string
  file: File
  maxBytes: number
  visibility?: UploadVisibility
  localUrlPrefix: string
}

export type ProcessUploadResult = {
  /** Value to persist in DB */
  url: string
  key?: string
  contentType: string
}

export async function processUpload(input: ProcessUploadInput): Promise<ProcessUploadResult> {
  const raw = Buffer.from(await input.file.arrayBuffer())
  const validated = await validateUpload(raw, input.maxBytes)
  const encoded = await reencodeImage(raw, validated.mime)

  const filename = `${input.ownerId}-${randomBytes(8).toString('hex')}.${encoded.ext}`
  const visibility = input.visibility ?? 'public'

  if (visibility === 'private' && isR2Configured()) {
    const key = privateObjectKey(input.folder, filename)
    await uploadToPrivateR2(key, encoded.buffer, encoded.mime)
    return {
      url: `/api/media/private/${input.folder}/${filename}`,
      key,
      contentType: encoded.mime,
    }
  }

  if (isR2Configured()) {
    const key = `${input.folder}/${filename}`
    const publicUrl = await putPublicObject(key, encoded.buffer, encoded.mime)
    return { url: publicUrl, key, contentType: encoded.mime }
  }

  const localDir = path.join(process.cwd(), 'public', 'uploads', input.folder)
  await mkdir(localDir, { recursive: true })
  await writeFile(path.join(localDir, filename), encoded.buffer)

  if (visibility === 'private') {
    return {
      url: `/api/media/private/local/${input.folder}/${filename}`,
      key: `local/${input.folder}/${filename}`,
      contentType: encoded.mime,
    }
  }

  return { url: `${input.localUrlPrefix}${filename}`, contentType: encoded.mime }
}

/** Backward-compatible wrapper returning URL string only. */
export async function processUploadUrl(input: ProcessUploadInput): Promise<string> {
  const result = await processUpload(input)
  return result.url
}
