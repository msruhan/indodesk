import { prisma } from '@/lib/db'
import {
  getDefaultTemplate,
  isTelegramEventKey,
  TELEGRAM_EVENT_KEYS,
  type TelegramEventKey,
} from '@/lib/telegram/template-defaults'

export type EffectiveTelegramTemplate = {
  eventKey: TelegramEventKey
  label: string
  description: string
  audience: 'CHANNEL' | 'TEKNISI'
  placeholders: readonly string[]
  body: string
  isEnabled: boolean
  isCustomized: boolean
  sampleVars: Record<string, string>
  updatedAt: string | null
}

export async function getEffectiveTemplate(
  eventKey: TelegramEventKey,
): Promise<{ body: string; isEnabled: boolean }> {
  const def = getDefaultTemplate(eventKey)
  const row = await prisma.telegramNotificationTemplate.findUnique({
    where: { eventKey },
  })
  if (!row) {
    return { body: def.defaultBody, isEnabled: true }
  }
  return {
    body: row.body,
    isEnabled: row.isEnabled,
  }
}

export async function listEffectiveTemplates(): Promise<EffectiveTelegramTemplate[]> {
  const rows = await prisma.telegramNotificationTemplate.findMany()
  const byKey = new Map(rows.map((r) => [r.eventKey, r]))

  return TELEGRAM_EVENT_KEYS.map((eventKey) => {
    const def = getDefaultTemplate(eventKey)
    const row = byKey.get(eventKey)
    return {
      eventKey,
      label: def.label,
      description: def.description,
      audience: def.audience,
      placeholders: def.placeholders,
      body: row?.body ?? def.defaultBody,
      isEnabled: row?.isEnabled ?? true,
      isCustomized: Boolean(row),
      sampleVars: def.sampleVars,
      updatedAt: row?.updatedAt.toISOString() ?? null,
    }
  })
}

export async function saveTemplateOverride(
  eventKey: TelegramEventKey,
  body: string,
  isEnabled: boolean,
): Promise<void> {
  await prisma.telegramNotificationTemplate.upsert({
    where: { eventKey },
    create: { eventKey, body, isEnabled },
    update: { body, isEnabled },
  })
}

export async function resetTemplateOverride(eventKey: TelegramEventKey): Promise<void> {
  await prisma.telegramNotificationTemplate.deleteMany({ where: { eventKey } })
}

export function assertTelegramEventKey(value: string): TelegramEventKey {
  if (!isTelegramEventKey(value)) {
    throw new Error('EVENT_KEY_INVALID')
  }
  return value
}
