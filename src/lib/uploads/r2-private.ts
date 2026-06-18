import 'server-only'

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { isR2Configured, getR2Object } from '@/lib/r2-storage'

function privateBucketConfig() {
  const privateBucket = process.env.R2_PRIVATE_BUCKET_NAME?.trim()
  const privateEndpoint = process.env.R2_PRIVATE_ENDPOINT?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (privateBucket && privateEndpoint && accessKeyId && secretAccessKey) {
    return {
      bucket: privateBucket,
      endpoint: privateEndpoint,
      accessKeyId,
      secretAccessKey,
    }
  }
  return null
}

let privateClient: S3Client | null = null

function getPrivateClient(): S3Client | null {
  const cfg = privateBucketConfig()
  if (!cfg) return null
  if (!privateClient) {
    privateClient = new S3Client({
      region: 'auto',
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    })
  }
  return privateClient
}

export function isPrivateR2Configured(): boolean {
  return privateBucketConfig() !== null
}

export function privateObjectKey(folder: string, filename: string): string {
  return `private/${folder}/${filename}`
}

export async function uploadToPrivateR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const cfg = privateBucketConfig()
  const client = getPrivateClient()
  if (cfg && client) {
    await client.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    )
    return
  }

  if (!isR2Configured()) {
    throw new Error('R2 private bucket tidak dikonfigurasi')
  }

  // Dev fallback: store under private/ prefix in public bucket
  const { putPublicObject } = await import('@/lib/r2-storage')
  await putPublicObject(key, body, contentType)
}

export async function getPrivateR2Object(
  key: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  const cfg = privateBucketConfig()
  const client = getPrivateClient()
  if (cfg && client) {
    try {
      const res = await client.send(
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

  return getR2Object(key)
}

export async function getSignedUrlForPrivate(key: string, ttlSec = 3600): Promise<string | null> {
  const cfg = privateBucketConfig()
  const client = getPrivateClient()
  if (!cfg || !client) {
    return null
  }

  const command = new GetObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
  })
  return getSignedUrl(client, command, { expiresIn: ttlSec })
}
