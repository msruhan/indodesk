import 'server-only'

import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { isR2Configured } from '@/lib/r2-storage'
import { isPrivateR2Configured } from '@/lib/uploads/r2-private'

async function deleteFromPrivateBucket(key: string): Promise<boolean> {
  const privateBucket = process.env.R2_PRIVATE_BUCKET_NAME?.trim()
  const privateEndpoint = process.env.R2_PRIVATE_ENDPOINT?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!privateBucket || !privateEndpoint || !accessKeyId || !secretAccessKey) {
    return false
  }

  const { S3Client } = await import('@aws-sdk/client-s3')
  const client = new S3Client({
    region: 'auto',
    endpoint: privateEndpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  await client.send(
    new DeleteObjectCommand({
      Bucket: privateBucket,
      Key: key,
    }),
  )
  return true
}

async function deleteFromPublicBucket(key: string): Promise<void> {
  if (!isR2Configured()) return
  const bucket = process.env.R2_BUCKET_NAME
  const endpoint = process.env.R2_ENDPOINT
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) return

  const { S3Client } = await import('@aws-sdk/client-s3')
  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )
  } catch {
    /* ignore */
  }
}

export async function deletePrivateObject(key: string): Promise<void> {
  if (!key || key.includes('..')) return

  if (isPrivateR2Configured()) {
    await deleteFromPrivateBucket(key)
    return
  }

  if (key.startsWith('private/') && isR2Configured()) {
    await deleteFromPublicBucket(key)
  }
}
