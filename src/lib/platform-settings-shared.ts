/**
 * Tipe & helper pengaturan platform yang aman untuk dipakai di sisi client
 * (tidak melakukan import prisma). File `platform-settings.ts` (server-only)
 * me-reekspor isi file ini supaya kontrak tetap konsisten.
 */

import {
  DEFAULT_COMING_SOON_HEADLINE,
  DEFAULT_COMING_SOON_MESSAGE,
} from '@/lib/coming-soon-shared'

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
  'cari_teknisi_enabled',
  'konsultasi_service_enabled',
  'rekber_service_enabled',
  'coming_soon_enabled',
  'coming_soon_launch_at',
  'coming_soon_headline',
  'coming_soon_message',
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
   * Apakah menu "Remote Online" di Ruang Teknisi, halaman /remote (IndoDesk),
   * dan pemesanan konsultasi remote diizinkan.
   */
  remoteServiceEnabled: boolean
  /**
   * Apakah menu "Inspeksi HP" di Ruang Teknisi, sidebar dashboard user/teknisi,
   * dan halaman inspeksi ditampilkan. ADMIN tetap dapat mengakses panel admin.
   */
  inspectionServiceEnabled: boolean
  /**
   * Apakah menu "Cari Teknisi" di Ruang Teknisi dan halaman /teknisi ditampilkan
   * untuk user, teknisi, dan pengunjung.
   */
  cariTeknisiEnabled: boolean
  /**
   * Apakah menu Konsultasi & Iklan Konsultasi ditampilkan di dashboard user/teknisi
   * serta pemesanan konsultasi diizinkan.
   */
  konsultasiServiceEnabled: boolean
  /**
   * Apakah menu "Transaksi Aman" di navigasi publik, sidebar dashboard user/teknisi,
   * dan halaman layanan transaksi aman ditampilkan. ADMIN tetap memiliki akses panel admin.
   */
  rekberServiceEnabled: boolean
  /** Soft launch: arahkan seluruh halaman publik ke /coming-soon. Admin tetap bypass. */
  comingSoonEnabled: boolean
  /** ISO datetime target peluncuran untuk countdown (opsional). */
  comingSoonLaunchAt: string | null
  comingSoonHeadline: string
  comingSoonMessage: string
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsDto = {
  platformName: 'Bantoo',
  supportEmail: 'hello@bantoo.in',
  supportPhone: '0800-1234-5678',
  adminEmail: 'admin@bantoo.in',
  buyerFeePercent: 2,
  sellerFeePercent: 2.5,
  maintenanceMode: false,
  imeiServiceEnabled: true,
  remoteServiceEnabled: true,
  inspectionServiceEnabled: true,
  cariTeknisiEnabled: true,
  konsultasiServiceEnabled: true,
  rekberServiceEnabled: true,
  comingSoonEnabled: false,
  comingSoonLaunchAt: null,
  comingSoonHeadline: DEFAULT_COMING_SOON_HEADLINE,
  comingSoonMessage: DEFAULT_COMING_SOON_MESSAGE,
}

/**
 * Subset feature flag publik (dipakai client untuk gate UI seperti menu
 * "Layanan Perangkat", "Remote", dan "Inspeksi").
 */
export type PublicFeatureFlags = {
  imeiServiceEnabled: boolean
  remoteServiceEnabled: boolean
  inspectionServiceEnabled: boolean
  cariTeknisiEnabled: boolean
  konsultasiServiceEnabled: boolean
  rekberServiceEnabled: boolean
  /** Login / daftar via Google OAuth (dari env AUTH_GOOGLE_*). */
  googleAuthEnabled: boolean
}

export const DEFAULT_PUBLIC_FEATURE_FLAGS: PublicFeatureFlags = {
  imeiServiceEnabled: DEFAULT_PLATFORM_SETTINGS.imeiServiceEnabled,
  remoteServiceEnabled: DEFAULT_PLATFORM_SETTINGS.remoteServiceEnabled,
  inspectionServiceEnabled: DEFAULT_PLATFORM_SETTINGS.inspectionServiceEnabled,
  cariTeknisiEnabled: DEFAULT_PLATFORM_SETTINGS.cariTeknisiEnabled,
  konsultasiServiceEnabled: DEFAULT_PLATFORM_SETTINGS.konsultasiServiceEnabled,
  rekberServiceEnabled: DEFAULT_PLATFORM_SETTINGS.rekberServiceEnabled,
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

/**
 * Role yang diizinkan melihat menu "Cari Teknisi" dan halaman /teknisi.
 *
 * - ADMIN selalu boleh.
 * - USER, TEKNISI, dan pengunjung mengikuti `cariTeknisiEnabled`.
 */
export function canAccessCariTeknisi(role: Role, flags: PublicFeatureFlags): boolean {
  if (role === 'ADMIN') return true
  return flags.cariTeknisiEnabled
}

/**
 * Role yang diizinkan melihat menu Konsultasi & Iklan Konsultasi di dashboard.
 *
 * - ADMIN selalu boleh.
 * - USER & TEKNISI mengikuti `konsultasiServiceEnabled`.
 */
export function canAccessKonsultasiService(role: Role, flags: PublicFeatureFlags): boolean {
  if (role === 'ADMIN') return true
  return flags.konsultasiServiceEnabled
}

/**
 * Role yang diizinkan melihat menu Transaksi Aman dan halaman layanan transaksi aman.
 *
 * - ADMIN selalu boleh (panel admin transaksi aman).
 * - USER, TEKNISI, dan pengunjung mengikuti `rekberServiceEnabled`.
 */
export function canAccessRekberService(role: Role, flags: PublicFeatureFlags): boolean {
  if (role === 'ADMIN') return true
  return flags.rekberServiceEnabled
}
