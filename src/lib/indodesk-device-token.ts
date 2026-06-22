import { createHash, randomBytes } from 'node:crypto'

export function hashIndodeskDeviceToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateIndodeskDeviceToken(): string {
  return randomBytes(32).toString('base64url')
}

export function generateIndodeskPairingCode(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000))
}
