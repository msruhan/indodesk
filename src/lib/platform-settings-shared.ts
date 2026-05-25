/**
 * Tipe & helper pengaturan platform yang aman untuk dipakai di sisi client
 * (tidak melakukan import prisma). File `platform-settings.ts` (server-only)
 * me-reekspor isi file ini supaya kontrak tetap konsisten.
 */

export const PLATFORM_SETTING_KEYS = [
  'platform_name',
  'support_email',
  'support_phone',
  'admin_email',
  'fee_percent',
  'maintenance_mode',
  'imei_service_enabled',
  'remote_service_enabled',
  'inspection_service_enabled',
] as const

export type PlatformSettingKey = (typeof PLATFORM_SETTING_KEYS)[number]

export type PlatformSettingsDto = {
  platformName: string
  supportEmail: string
  supportPhone: string
  adminEmail: string
  feePercent: number
  maintenanceMode: boolean
  /**
   * Apakah menu "Layanan Perangkat" (IMEI/Server services) ditampilkan untuk
   * teknisi. Admin selalu memiliki akses ke panel admin terkait, dan
   * pengguna biasa (USER) tidak pernah melihat menu ini.
   */
  imeiServiceEnabled: boolean
  /**
   * Apakah menu "Remote" (remote assistance) ditampilkan untuk pengunjung,
   * USER, dan TEKNISI. ADMIN tetap dapat mengakses panel admin terkait.
   */
  remoteServiceEnabled: boolean
  /**
   * Apakah menu "Inspeksi" (pre-purchase inspection) ditampilkan untuk
   * pengunjung, USER, dan TEKNISI. ADMIN tetap dapat mengakses panel admin
   * terkait.
   */
  inspectionServiceEnabled: boolean
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsDto = {
  platformName: 'IndoTeknizi',
  supportEmail: 'support@indoteknizi.com',
  supportPhone: '0800-1234-5678',
  adminEmail: 'admin@indoteknizi.com',
  feePercent: 2.5,
  maintenanceMode: false,
  imeiServiceEnabled: true,
  remoteServiceEnabled: true,
  inspectionServiceEnabled: true,
}

/**
 * Subset feature flag publik (dipakai client untuk gate UI seperti menu
 * "Layanan Perangkat", "Remote", dan "Inspeksi").
 */
export type PublicFeatureFlags = {
  imeiServiceEnabled: boolean
  remoteServiceEnabled: boolean
  inspectionServiceEnabled: boolean
}

export const DEFAULT_PUBLIC_FEATURE_FLAGS: PublicFeatureFlags = {
  imeiServiceEnabled: DEFAULT_PLATFORM_SETTINGS.imeiServiceEnabled,
  remoteServiceEnabled: DEFAULT_PLATFORM_SETTINGS.remoteServiceEnabled,
  inspectionServiceEnabled: DEFAULT_PLATFORM_SETTINGS.inspectionServiceEnabled,
}

type Role = 'ADMIN' | 'TEKNISI' | 'USER' | null | undefined

/**
 * Role yang diizinkan melihat menu "Layanan Perangkat".
 *
 * Aturan produk:
 * - ADMIN selalu boleh (untuk akses panel admin & dashboard).
 * - TEKNISI boleh hanya jika feature flag `imeiServiceEnabled` aktif.
 * - USER & guest tidak pernah melihat menu ini.
 */
export function canAccessImeiService(role: Role, flags: PublicFeatureFlags): boolean {
  if (role === 'ADMIN') return true
  if (role === 'TEKNISI') return flags.imeiServiceEnabled
  return false
}

/**
 * Role yang diizinkan melihat menu "Remote".
 *
 * - ADMIN selalu boleh (untuk akses panel monitoring & log).
 * - Selain ADMIN, mengikuti `remoteServiceEnabled`. Bila flag mati, fitur
 *   menjadi tidak terlihat di navigasi publik (mis. saat maintenance).
 */
export function canAccessRemoteService(role: Role, flags: PublicFeatureFlags): boolean {
  if (role === 'ADMIN') return true
  return flags.remoteServiceEnabled
}

/**
 * Role yang diizinkan melihat menu "Inspeksi".
 *
 * - ADMIN selalu boleh (untuk akses panel admin inspeksi).
 * - Selain ADMIN, mengikuti `inspectionServiceEnabled`.
 */
export function canAccessInspectionService(role: Role, flags: PublicFeatureFlags): boolean {
  if (role === 'ADMIN') return true
  return flags.inspectionServiceEnabled
}
