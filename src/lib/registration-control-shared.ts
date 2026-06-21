/** Pesan saat pendaftaran user ditutup sementara oleh admin. */
export const USER_REGISTRATION_CLOSED_MESSAGE =
  'Pendaftaran akun user sementara ditutup. Silakan coba lagi nanti atau hubungi tim support Bantoo.'

/** Pesan saat pendaftaran teknisi ditutup sementara oleh admin. */
export const TEKNISI_REGISTRATION_CLOSED_MESSAGE =
  'Pendaftaran teknisi sementara ditutup. Silakan coba lagi nanti atau hubungi tim support Bantoo.'

export type PublicRegistrationFlags = {
  userRegistrationEnabled: boolean
  teknisiRegistrationEnabled: boolean
}

export const DEFAULT_PUBLIC_REGISTRATION_FLAGS: PublicRegistrationFlags = {
  userRegistrationEnabled: true,
  teknisiRegistrationEnabled: true,
}
