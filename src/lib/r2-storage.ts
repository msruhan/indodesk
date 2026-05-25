import 'server-only'

import { randomBytes } from 'crypto'
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { isR2PublicUrl } from '@/lib/image-url-utils'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME
  const endpoint = process.env.R2_ENDPOINT
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '')

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !endpoint || !publicBaseUrl) {
    return null
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, endpoint, publicBaseUrl }
}

let client: S3Client | null = null

function getClient(): S3Client {
  const cfg = getR2Config()
  if (!cfg) throw new Error('R2 belum dikonfigurasi di environment')

  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    })
  }
  return client
}

export function isR2Configured(): boolean {
  return getR2Config() !== null
}

export function extensionFromMime(type: string): string {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/gif') return 'gif'
  return 'bin'
}

export function validateImageFile(file: File, maxBytes: number): void {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Format gambar harus JPEG, PNG, WebP, atau GIF')
  }
  if (file.size > maxBytes) {
    throw new Error(`Ukuran gambar maksimal ${Math.round(maxBytes / (1024 * 1024))} MB`)
  }
}

export async function uploadFileToR2(
  folder: string,
  file: File,
  ownerId: string,
  maxBytes: number,
): Promise<string> {
  validateImageFile(file, maxBytes)
  const cfg = getR2Config()
  if (!cfg) throw new Error('R2 belum dikonfigurasi')

  const ext = extensionFromMime(file.type)
  const key = `${folder}/${ownerId}-${randomBytes(8).toString('hex')}.${ext}`
  const body = Buffer.from(await file.arrayBuffer())

  await getClient().send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: file.type,
    }),
  )

  return `${cfg.publicBaseUrl}/${key}`
}

export async function deleteFileFromR2(publicUrl: string | null | undefined): Promise<void> {
  if (!isR2PublicUrl(publicUrl)) return
  const cfg = getR2Config()
  if (!cfg || !publicUrl) return

  const key = publicUrl.slice(cfg.publicBaseUrl.length + 1)
  if (!key) return

  try {
    await getClient().send(
      new DeleteObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
      }),
    )
  } catch {
    /* ignore missing object */
  }
}

export function extractR2KeyFromPublicUrl(publicUrl: string): string | null {
  const cfg = getR2Config()
  if (cfg && publicUrl.startsWith(`${cfg.publicBaseUrl}/`)) {
    return publicUrl.slice(cfg.publicBaseUrl.length + 1)
  }
  const match = publicUrl.match(/^https:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+)$/i)
  return match?.[1] ?? null
}

export async function getR2Object(
  key: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  const cfg = getR2Config()
  if (!cfg || !key || key.includes('..')) return null

  try {
    const res = await getClient().send(
      new GetObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
      }),
    )
    if (!res.Body) return null
    const bytes = await res.Body.transformToByteArray()
    return {
      body: Buffer.from(bytes),
      contentType: res.ContentType ?? 'application/octet-stream',
    }
  } catch {
    return null
  }
}
