import { generateSecret, generateURI, verify } from 'otplib'
import QRCode from 'qrcode'

const APP_NAME = 'IndoTeknizi'

export function generateTotpSecret(): string {
  return generateSecret()
}

export function buildTotpUri(email: string, secret: string): string {
  return generateURI({
    issuer: APP_NAME,
    label: email,
    secret,
  })
}

export async function totpQrDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, { width: 220, margin: 2 })
}

export async function verifyTotpCode(token: string, secret: string): Promise<boolean> {
  const code = token.replace(/\s/g, '')
  if (!/^\d{6}$/.test(code)) return false
  const result = await verify({ token: code, secret })
  return result.valid
}
