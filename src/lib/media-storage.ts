import 'server-only'

import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'
import {
  deleteFileFromR2,
  extractR2KeyFromPublicUrl,
  isR2Configured,
} from '@/lib/r2-storage'
import { isR2PublicUrl } from '@/lib/image-url-utils'
import { processUploadUrl, type UploadVisibility } from '@/lib/uploads/pipeline'
import { getPrivateR2Object } from '@/lib/uploads/r2-private'

type SaveImageOptions = {
  folder: string
  localUrlPrefix: string
  file: File
  ownerId: string
  maxBytes: number
  visibility?: UploadVisibility
}

export async function saveImage(options: SaveImageOptions): Promise<string> {
  return processUploadUrl({
    folder: options.folder,
    localUrlPrefix: options.localUrlPrefix,
    file: options.file,
    ownerId: options.ownerId,
    maxBytes: options.maxBytes,
    visibility: options.visibility ?? 'public',
  })
}

export async function deleteImage(
  imageUrl: string | null | undefined,
  localUrlPrefix: string,
): Promise<void> {
  if (!imageUrl) return

  if (imageUrl.startsWith('/api/media/private/')) {
    const suffix = imageUrl.replace('/api/media/private/', '')
    const key =
      suffix.startsWith('local/') ? suffix : `private/${suffix}`
    if (suffix.startsWith('local/')) {
      try {
        const rel = suffix.replace(/^local\//, '')
        await unlink(path.join(process.cwd(), 'public', 'uploads', rel))
      } catch {
        /* ignore */
      }
    }
    const { deletePrivateObject } = await import('@/lib/uploads/r2-private-delete')
    await deletePrivateObject(key)
    return
  }

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

export async function readPrivateMediaBody(
  key: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  if (key.startsWith('local/')) {
    const rel = key.replace(/^local\//, '')
    try {
      const full = path.join(process.cwd(), 'public', 'uploads', rel)
      const { readFile } = await import('fs/promises')
      const body = await readFile(full)
      return { body, contentType: 'application/octet-stream' }
    } catch {
      return null
    }
  }

  if (isR2Configured()) {
    return getPrivateR2Object(key)
  }

  return null
}
