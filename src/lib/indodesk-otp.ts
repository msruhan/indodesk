import { randomInt } from 'node:crypto'

/** 6-digit numeric OTP for IndoDesk session password sync. */
export function generateIndodeskSessionOtp(): string {
  return String(randomInt(100_000, 1_000_000))
}

/** Normalize RustDesk ID for deep links (remove spaces). */
export function normalizeIndodeskId(id: string): string {
  return id.replace(/\s+/g, '').trim()
}
