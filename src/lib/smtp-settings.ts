import { prisma } from '@/lib/db'
import {
  decryptSecretField,
  encryptSecretField,
  hasStoredSecret,
  maskSecretForResponse,
} from '@/lib/crypto/secret-field'

const KEYS = {
  enabled: 'smtp_enabled',
  host: 'smtp_host',
  port: 'smtp_port',
  secure: 'smtp_secure',
  user: 'smtp_user',
  passEnc: 'smtp_pass_enc',
  from: 'smtp_from',
} as const

export type SmtpSettingsDto = {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  user: string
  from: string
  hasPassword: boolean
  passwordMasked: string
}

export type SmtpSettingsInput = {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  user: string
  from: string
  password?: string
}

export type SmtpRuntimeConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

const DEFAULTS: Omit<SmtpSettingsDto, 'hasPassword' | 'passwordMasked'> = {
  enabled: false,
  host: '',
  port: 587,
  secure: false,
  user: '',
  from: 'noreply@indoteknizi.com',
}

let runtimeCache: SmtpRuntimeConfig | null | undefined

export function invalidateSmtpConfigCache(): void {
  runtimeCache = undefined
}

async function readRows(): Promise<Map<string, string>> {
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: Object.values(KEYS) } },
  })
  return new Map(rows.map((r) => [r.key, r.value]))
}

function rowToDto(map: Map<string, string>): SmtpSettingsDto {
  const passEnc = map.get(KEYS.passEnc)
  return {
    enabled: map.get(KEYS.enabled) === 'true',
    host: map.get(KEYS.host) ?? DEFAULTS.host,
    port: Number(map.get(KEYS.port) ?? DEFAULTS.port),
    secure: map.get(KEYS.secure) === 'true',
    user: map.get(KEYS.user) ?? DEFAULTS.user,
    from: map.get(KEYS.from) ?? DEFAULTS.from,
    hasPassword: hasStoredSecret(passEnc),
    passwordMasked: hasStoredSecret(passEnc) ? maskSecretForResponse(passEnc) : '',
  }
}

export async function getSmtpSettings(): Promise<SmtpSettingsDto> {
  const map = await readRows()
  return rowToDto(map)
}

export async function saveSmtpSettings(input: SmtpSettingsInput): Promise<SmtpSettingsDto> {
  const existing = await readRows()
  const passEnc = existing.get(KEYS.passEnc)

  let nextPassEnc = passEnc ?? ''
  if (input.password?.trim()) {
    nextPassEnc = encryptSecretField(input.password.trim())
  } else if (input.enabled && !hasStoredSecret(passEnc)) {
    throw new Error('Password SMTP wajib diisi')
  }

  const rows: Array<{ key: string; value: string }> = [
    { key: KEYS.enabled, value: input.enabled ? 'true' : 'false' },
    { key: KEYS.host, value: input.host.trim() },
    { key: KEYS.port, value: String(input.port) },
    { key: KEYS.secure, value: input.secure ? 'true' : 'false' },
    { key: KEYS.user, value: input.user.trim() },
    { key: KEYS.from, value: input.from.trim() },
  ]
  if (nextPassEnc) {
    rows.push({ key: KEYS.passEnc, value: nextPassEnc })
  }

  await prisma.$transaction(
    rows.map((row) =>
      prisma.platformSetting.upsert({
        where: { key: row.key },
        create: row,
        update: { value: row.value },
      }),
    ),
  )

  invalidateSmtpConfigCache()
  return getSmtpSettings()
}

export async function getSmtpRuntimeConfig(): Promise<SmtpRuntimeConfig | null> {
  if (runtimeCache !== undefined) return runtimeCache

  const map = await readRows()
  const dto = rowToDto(map)
  if (!dto.enabled || !dto.host.trim()) {
    runtimeCache = null
    return null
  }

  const pass = decryptSecretField(map.get(KEYS.passEnc)) ?? ''
  if (!pass && dto.user) {
    runtimeCache = null
    return null
  }

  runtimeCache = {
    host: dto.host.trim(),
    port: dto.port,
    secure: dto.secure,
    user: dto.user.trim(),
    pass,
    from: dto.from.trim() || DEFAULTS.from,
  }
  return runtimeCache
}

export async function isSmtpConfigured(): Promise<boolean> {
  const cfg = await getSmtpRuntimeConfig()
  return cfg != null
}
