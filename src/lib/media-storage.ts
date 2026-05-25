import 'server-only'

import { randomBytes } from 'crypto'
import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'
import {
  deleteFileFromR2,
  isR2Configured,
  uploadFileToR2,
  validateImageFile,
} from '@/lib/r2-storage'
import { isR2PublicUrl } from '@/lib/image-url-utils'

type SaveImageOptions = {
  folder: string
  localUrlPrefix: string
  file: File
  ownerId: string
  maxBytes: number
}

export async function saveImage(options: SaveImageOptions): Promise<string> {
  const { folder, localUrlPrefix, file, ownerId, maxBytes } = options

  if (isR2Configured()) {
    return uploadFileToR2(folder, file, ownerId, maxBytes)
  }

  validateImageFile(file, maxBytes)
  const ext =
    file.type === 'image/jpeg'
      ? 'jpg'
      : file.type === 'image/png'
        ? 'png'
        : file.type === 'image/webp'
          ? 'webp'
          : 'gif'

  const localDir = path.join(process.cwd(), 'public', 'uploads', folder)
  await mkdir(localDir, { recursive: true })
  const filename = `${ownerId}-${randomBytes(8).toString('hex')}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(localDir, filename), buffer)
  return `${localUrlPrefix}${filename}`
}

export async function deleteImage(
  imageUrl: string | null | undefined,
  localUrlPrefix: string,
): Promise<void> {
  if (!imageUrl) return

  if (isR2PublicUrl(imageUrl)) {
    await deleteFileFromR2(imageUrl)
    return
  }

  if (!imageUrl.startsWith(localUrlPrefix)) return
  try {
    await unlink(path.join(process.cwd(), 'public', imageUrl))
  } catch {
    /* ignore */
  }
}
