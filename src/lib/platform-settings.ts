import { prisma } from '@/lib/db'
import {
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_PUBLIC_FEATURE_FLAGS,
  PLATFORM_SETTING_KEYS,
  canAccessImeiService,
  canAccessRemoteService,
  canAccessInspectionService,
  canAccessCariTeknisi,
  canAccessKonsultasiService,
  canAccessRekberService,
  canAccessTopupService,
  type PlatformSettingKey,
  type PlatformSettingsDto,
  type PublicFeatureFlags,
  type SellerFeeTier,
} from '@/lib/platform-settings-shared'
import { isGoogleAuthEnabled } from '@/lib/google-auth-enabled'
import {
  type ComingSoonConfig,
} from '@/lib/coming-soon-shared'
import { setCachedComingSoon } from '@/lib/coming-soon-cache'

export {
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_PUBLIC_FEATURE_FLAGS,
  PLATFORM_SETTING_KEYS,
  canAccessImeiService,
  canAccessRemoteService,
  canAccessInspectionService,
  canAccessCariTeknisi,
  canAccessKonsultasiService,
  canAccessRekberService,
  canAccessTopupService,
}
export type { PlatformSettingKey, PlatformSettingsDto, PublicFeatureFlags }

const KEY_MAP: Record<PlatformSettingKey, keyof PlatformSettingsDto | null> = {
  platform_name: 'platformName',
  support_email: 'supportEmail',
  support_phone: 'supportPhone',
  admin_email: 'adminEmail',
  buyer_fee_percent: 'buyerFeePercent',
  buyer_flat_fee_per_item: 'buyerFlatFeePerItem',
  seller_fee_percent: 'sellerFeePercent',
  seller_fee_tiers: 'sellerFeeTiers',
  konsultasi_fee_percent: 'konsultasiFeePercent',
  inspeksi_fee_percent: 'inspeksiFeePercent',
  fee_percent: null,
  maintenance_mode: 'maintenanceMode',
  imei_service_enabled: 'imeiServiceEnabled',
  remote_service_enabled: 'remoteServiceEnabled',
  inspection_service_enabled: 'inspectionServiceEnabled',
  cari_teknisi_enabled: 'cariTeknisiEnabled',
  konsultasi_service_enabled: 'konsultasiServiceEnabled',
  rekber_service_enabled: 'rekberServiceEnabled',
  topup_service_enabled: 'topupServiceEnabled',
  coming_soon_enabled: 'comingSoonEnabled',
  coming_soon_launch_at: 'comingSoonLaunchAt',
  coming_soon_headline: 'comingSoonHeadline',
  coming_soon_message: 'comingSoonMessage',
}

const REVERSE_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_MAP)
    .filter((entry): entry is [PlatformSettingKey, keyof PlatformSettingsDto] => entry[1] != null)
    .map(([k, v]) => [v, k]),
) as Record<keyof PlatformSettingsDto, PlatformSettingKey>

function parseSellerFeeTiers(raw: string | undefined): SellerFeeTier[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    const rows = parsed
      .map((item) => {
        const row = item as {
          minOrderAmount?: number
          minAmount?: number
          maxAmount?: number | null
          feePercent?: number
        }
        const feePercent = Number(row.feePercent)
        const minAmount = Number(row.minAmount ?? row.minOrderAmount)
        const maxAmountRaw = row.maxAmount
        const maxAmount =
          maxAmountRaw == null || maxAmountRaw === ('' as unknown as number)
            ? null
            : Number(maxAmountRaw)
        return { minAmount, maxAmount, feePercent }
      })
      .filter(
        (tier) =>
          Number.isFinite(tier.minAmount) &&
          Number.isFinite(tier.feePercent) &&
          tier.minAmount >= 0 &&
          (tier.maxAmount == null || Number.isFinite(tier.maxAmount)),
      )
      .sort((a, b) => a.minAmount - b.minAmount)

    // Migrasi tier lama (hanya minOrderAmount): max = min tier berikutnya - 1
    return rows.map((tier, index) => {
      if (tier.maxAmount != null) return tier as SellerFeeTier
      const nextMin = rows[index + 1]?.minAmount
      return {
        minAmount: tier.minAmount,
        maxAmount: nextMin != null ? Math.max(tier.minAmount, nextMin - 1) : null,
        feePercent: tier.feePercent,
      }
    })
  } catch {
    return []
  }
}

function dtoToRows(dto: PlatformSettingsDto): Array<{ key: string; value: string }> {
  return [
    { key: 'platform_name', value: dto.platformName },
    { key: 'support_email', value: dto.supportEmail },
    { key: 'support_phone', value: dto.supportPhone },
    { key: 'admin_email', value: dto.adminEmail },
    { key: 'buyer_fee_percent', value: String(dto.buyerFeePercent) },
    { key: 'buyer_flat_fee_per_item', value: String(dto.buyerFlatFeePerItem) },
    { key: 'seller_fee_percent', value: String(dto.sellerFeePercent) },
    { key: 'seller_fee_tiers', value: JSON.stringify(dto.sellerFeeTiers ?? []) },
    { key: 'konsultasi_fee_percent', value: String(dto.konsultasiFeePercent) },
    { key: 'inspeksi_fee_percent', value: String(dto.inspeksiFeePercent) },
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
    {
      key: 'cari_teknisi_enabled',
      value: dto.cariTeknisiEnabled ? 'true' : 'false',
    },
    {
      key: 'konsultasi_service_enabled',
      value: dto.konsultasiServiceEnabled ? 'true' : 'false',
    },
    {
      key: 'rekber_service_enabled',
      value: dto.rekberServiceEnabled ? 'true' : 'false',
    },
    {
      key: 'topup_service_enabled',
      value: dto.topupServiceEnabled ? 'true' : 'false',
    },
    {
      key: 'coming_soon_enabled',
      value: dto.comingSoonEnabled ? 'true' : 'false',
    },
    {
      key: 'coming_soon_launch_at',
      value: dto.comingSoonLaunchAt ?? '',
    },
    {
      key: 'coming_soon_headline',
      value: dto.comingSoonHeadline,
    },
    {
      key: 'coming_soon_message',
      value: dto.comingSoonMessage,
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
    buyerFlatFeePerItem: Number(
      map.get('buyer_flat_fee_per_item') ?? DEFAULT_PLATFORM_SETTINGS.buyerFlatFeePerItem,
    ),
    sellerFeePercent: Number(
      map.get('seller_fee_percent') ??
        map.get('fee_percent') ??
        DEFAULT_PLATFORM_SETTINGS.sellerFeePercent,
    ),
    sellerFeeTiers: parseSellerFeeTiers(map.get('seller_fee_tiers')),
    konsultasiFeePercent: Number(
      map.get('konsultasi_fee_percent') ?? DEFAULT_PLATFORM_SETTINGS.konsultasiFeePercent,
    ),
    inspeksiFeePercent: Number(
      map.get('inspeksi_fee_percent') ?? DEFAULT_PLATFORM_SETTINGS.inspeksiFeePercent,
    ),
    maintenanceMode: map.get('maintenance_mode') === 'true',
    // Default ke true bila belum pernah disimpan supaya behaviour existing tidak berubah.
    imeiServiceEnabled: (map.get('imei_service_enabled') ?? 'true') === 'true',
    remoteServiceEnabled: (map.get('remote_service_enabled') ?? 'true') === 'true',
    inspectionServiceEnabled:
      (map.get('inspection_service_enabled') ?? 'true') === 'true',
    cariTeknisiEnabled:
      (map.get('cari_teknisi_enabled') ?? map.get('teknisi_room_enabled') ?? 'true') === 'true',
    konsultasiServiceEnabled: (map.get('konsultasi_service_enabled') ?? 'true') === 'true',
    rekberServiceEnabled: (map.get('rekber_service_enabled') ?? 'true') === 'true',
    topupServiceEnabled: (map.get('topup_service_enabled') ?? 'true') === 'true',
    comingSoonEnabled: map.get('coming_soon_enabled') === 'true',
    comingSoonLaunchAt: (() => {
      const raw = map.get('coming_soon_launch_at')?.trim()
      return raw ? raw : null
    })(),
    comingSoonHeadline:
      map.get('coming_soon_headline')?.trim() || DEFAULT_PLATFORM_SETTINGS.comingSoonHeadline,
    comingSoonMessage:
      map.get('coming_soon_message')?.trim() || DEFAULT_PLATFORM_SETTINGS.comingSoonMessage,
  }
}

function settingsToComingSoonConfig(dto: PlatformSettingsDto): ComingSoonConfig {
  return {
    enabled: dto.comingSoonEnabled,
    launchAt: dto.comingSoonLaunchAt,
    headline: dto.comingSoonHeadline,
    message: dto.comingSoonMessage,
  }
}

async function syncComingSoonCache(dto: PlatformSettingsDto): Promise<void> {
  await setCachedComingSoon(settingsToComingSoonConfig(dto))
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
  const saved = await getPlatformSettings()
  await syncComingSoonCache(saved)
  return saved
}

export async function warmComingSoonCache(): Promise<void> {
  const dto = await getPlatformSettings()
  await syncComingSoonCache(dto)
}

/** Public config for halaman coming soon — sekaligus mem-warm cache edge. */
export async function getPublicComingSoonConfig(): Promise<ComingSoonConfig> {
  const dto = await getPlatformSettings()
  const config = settingsToComingSoonConfig(dto)
  await setCachedComingSoon(config)
  return config
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
    buyerFlatFeePerItem: s.buyerFlatFeePerItem,
    sellerFeePercent: s.sellerFeePercent,
    sellerFeeTiers: s.sellerFeeTiers,
  }
}

export async function getPublicFeatureFlags(): Promise<PublicFeatureFlags> {
  const s = await getPlatformSettings()
  return {
    imeiServiceEnabled: s.imeiServiceEnabled,
    remoteServiceEnabled: s.remoteServiceEnabled,
    inspectionServiceEnabled: s.inspectionServiceEnabled,
    cariTeknisiEnabled: s.cariTeknisiEnabled,
    konsultasiServiceEnabled: s.konsultasiServiceEnabled,
    rekberServiceEnabled: s.rekberServiceEnabled,
    topupServiceEnabled: s.topupServiceEnabled,
    googleAuthEnabled: isGoogleAuthEnabled,
  }
}

export { REVERSE_KEY_MAP }
