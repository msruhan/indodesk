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
  'buyer_fee_percent',
  'seller_fee_percent',
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
  buyerFeePercent: number
  sellerFeePercent: number
  maintenanceMode: boolean
  /**
   * Apakah menu "Layanan Perangkat" (IMEI/Server services) ditampilkan untuk
   * teknisi. Admin selalu memiliki akses ke panel admin terkait, dan
   * pengguna biasa (USER) tidak pernah melihat menu ini.
   */
  imeiServiceEnabled: boolean
  /**
   * Apakah halaman publik /remote (IndoDesk) dan pemesanan konsultasi remote
   * (requiresRemote) diizinkan. Sesi remote dikelola di Konsultasi, bukan menu terpisah.
   */
  remoteServiceEnabled: boolean
  /**
   * Apakah menu "Inspeksi" ditampilkan di navigasi publik dan sidebar user/teknisi.
   * ADMIN tetap dapat mengakses panel admin terkait.
   */
  inspectionServiceEnabled: boolean
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsDto = {
  platformName: 'Bantoo',
  supportEmail: 'support@bantoo.in',
  supportPhone: '0800-1234-5678',
  adminEmail: 'admin@bantoo.in',
  buyerFeePercent: 2,
  sellerFeePercent: 2.5,
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
  /** Login / daftar via Google OAuth (dari env AUTH_GOOGLE_*). */
  googleAuthEnabled: boolean
}

export const DEFAULT_PUBLIC_FEATURE_FLAGS: PublicFeatureFlags = {
  imeiServiceEnabled: DEFAULT_PLATFORM_SETTINGS.imeiServiceEnabled,
  remoteServiceEnabled: DEFAULT_PLATFORM_SETTINGS.remoteServiceEnabled,
  inspectionServiceEnabled: DEFAULT_PLATFORM_SETTINGS.inspectionServiceEnabled,
  googleAuthEnabled: false,
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
 * Role yang diizinkan melihat halaman IndoDesk (/remote) dan memesan konsultasi remote.
 *
 * - ADMIN selalu boleh.
 * - Selain ADMIN, mengikuti `remoteServiceEnabled`.
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
