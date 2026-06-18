import { createHash, randomBytes } from 'node:crypto'

export function hashTopupPollToken(plain: string): string {
  return createHash('sha256').update(plain.trim()).digest('hex')
}

export function generateTopupPollToken(): { plain: string; hash: string } {
  const plain = randomBytes(24).toString('base64url')
  return { plain, hash: hashTopupPollToken(plain) }
}
