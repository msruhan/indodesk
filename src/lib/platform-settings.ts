import { prisma } from '@/lib/db'
import {
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_PUBLIC_FEATURE_FLAGS,
  PLATFORM_SETTING_KEYS,
  canAccessImeiService,
  canAccessRemoteService,
  canAccessInspectionService,
  type PlatformSettingKey,
  type PlatformSettingsDto,
  type PublicFeatureFlags,
} from '@/lib/platform-settings-shared'
import { isGoogleAuthEnabled } from '@/lib/google-auth-enabled'

export {
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_PUBLIC_FEATURE_FLAGS,
  PLATFORM_SETTING_KEYS,
  canAccessImeiService,
  canAccessRemoteService,
  canAccessInspectionService,
}
export type { PlatformSettingKey, PlatformSettingsDto, PublicFeatureFlags }

const KEY_MAP: Record<PlatformSettingKey, keyof PlatformSettingsDto | null> = {
  platform_name: 'platformName',
  support_email: 'supportEmail',
  support_phone: 'supportPhone',
  admin_email: 'adminEmail',
  buyer_fee_percent: 'buyerFeePercent',
  seller_fee_percent: 'sellerFeePercent',
  fee_percent: null,
  maintenance_mode: 'maintenanceMode',
  imei_service_enabled: 'imeiServiceEnabled',
  remote_service_enabled: 'remoteServiceEnabled',
  inspection_service_enabled: 'inspectionServiceEnabled',
}

const REVERSE_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_MAP)
    .filter((entry): entry is [PlatformSettingKey, keyof PlatformSettingsDto] => entry[1] != null)
    .map(([k, v]) => [v, k]),
) as Record<keyof PlatformSettingsDto, PlatformSettingKey>

function dtoToRows(dto: PlatformSettingsDto): Array<{ key: string; value: string }> {
  return [
    { key: 'platform_name', value: dto.platformName },
    { key: 'support_email', value: dto.supportEmail },
    { key: 'support_phone', value: dto.supportPhone },
    { key: 'admin_email', value: dto.adminEmail },
    { key: 'buyer_fee_percent', value: String(dto.buyerFeePercent) },
    { key: 'seller_fee_percent', value: String(dto.sellerFeePercent) },
    { key: 'maintenance_mode', value: dto.maintenanceMode ? 'true' : 'false' },
    { key: 'imei_service_enabled', value: dto.imeiServiceEnabled ? 'true' : 'false' },
    {
      key: 'remote_service_enabled',
      value: dto.remoteServiceEnabled ? 'true' : 'false',
    },
    {
      key: 'inspection_service_enabled',
      value: dto.inspectionServiceEnabled ? 'true' : 'false',
    },
  ]
}

function rowToDto(rows: Array<{ key: string; value: string }>): PlatformSettingsDto {
  const map = new Map(rows.map((r) => [r.key, r.value]))
  return {
    platformName: map.get('platform_name') ?? DEFAULT_PLATFORM_SETTINGS.platformName,
    supportEmail: map.get('support_email') ?? DEFAULT_PLATFORM_SETTINGS.supportEmail,
    supportPhone: map.get('support_phone') ?? DEFAULT_PLATFORM_SETTINGS.supportPhone,
    adminEmail: map.get('admin_email') ?? DEFAULT_PLATFORM_SETTINGS.adminEmail,
    buyerFeePercent: Number(
      map.get('buyer_fee_percent') ?? DEFAULT_PLATFORM_SETTINGS.buyerFeePercent,
    ),
    sellerFeePercent: Number(
      map.get('seller_fee_percent') ??
        map.get('fee_percent') ??
        DEFAULT_PLATFORM_SETTINGS.sellerFeePercent,
    ),
    maintenanceMode: map.get('maintenance_mode') === 'true',
    // Default ke true bila belum pernah disimpan supaya behaviour existing tidak berubah.
    imeiServiceEnabled: (map.get('imei_service_enabled') ?? 'true') === 'true',
    remoteServiceEnabled: (map.get('remote_service_enabled') ?? 'true') === 'true',
    inspectionServiceEnabled:
      (map.get('inspection_service_enabled') ?? 'true') === 'true',
  }
}

export async function getPlatformSettings(): Promise<PlatformSettingsDto> {
  const rows = await prisma.platformSetting.findMany()
  if (rows.length === 0) return { ...DEFAULT_PLATFORM_SETTINGS }
  return rowToDto(rows)
}

export async function savePlatformSettings(dto: PlatformSettingsDto): Promise<PlatformSettingsDto> {
  const rows = dtoToRows(dto)
  await prisma.$transaction(
    rows.map((row) =>
      prisma.platformSetting.upsert({
        where: { key: row.key },
        create: row,
        update: { value: row.value },
      }),
    ),
  )
  return getPlatformSettings()
}

/** Public subset for help pages & footer */
export async function getPublicPlatformContact() {
  const s = await getPlatformSettings()
  return {
    platformName: s.platformName,
    supportEmail: s.supportEmail,
    supportPhone: s.supportPhone,
    maintenanceMode: s.maintenanceMode,
  }
}

export async function getPublicMarketplaceFeeRates() {
  const s = await getPlatformSettings()
  return {
    buyerFeePercent: s.buyerFeePercent,
    sellerFeePercent: s.sellerFeePercent,
  }
}

export async function getPublicFeatureFlags(): Promise<PublicFeatureFlags> {
  const s = await getPlatformSettings()
  return {
    imeiServiceEnabled: s.imeiServiceEnabled,
    remoteServiceEnabled: s.remoteServiceEnabled,
    inspectionServiceEnabled: s.inspectionServiceEnabled,
    googleAuthEnabled: isGoogleAuthEnabled,
  }
}

export { REVERSE_KEY_MAP }
