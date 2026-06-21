export type OAuthLoginErrorCode =
  | 'not_registered'
  | 'google_not_linked'
  | 'OAuthAccountNotLinked'
  | 'oauth_2fa'
  | 'admin_google'
  | 'account_inactive'
  | 'google_email_missing'
  | 'google_link_mismatch'
  | 'google_email_mismatch'
  | 'google_already_linked'
  | 'teknisi_blocked'
  | 'coming_soon_admin_only'
  | 'AccessDenied'
  | 'Configuration'
  | 'OAuthSignin'
  | 'OAuthCallback'
  | 'OAuthCreateAccount'
  | 'CallbackRouteError'

export type OAuthLoginErrorDetails = {
  code: OAuthLoginErrorCode
  title: string
  message: string
  showRegisterLinks?: boolean
}

const LOGIN_OAUTH_ERROR_DETAILS: Record<string, Omit<OAuthLoginErrorDetails, 'code'>> = {
  not_registered: {
    title: 'Akun belum terdaftar',
    message:
      'Email Google yang Anda pilih belum terdaftar di Bantoo. Daftar akun user atau teknisi terlebih dahulu, lalu hubungkan Google dari menu Profil → Keamanan jika ingin login cepat.',
    showRegisterLinks: true,
  },
  google_not_linked: {
    title: 'Google belum dihubungkan',
    message:
      'Email Google ini sudah ada di Bantoo, tetapi belum dihubungkan. Login dengan email & password, lalu buka Profil → Keamanan untuk menghubungkan Google.',
  },
  OAuthAccountNotLinked: {
    title: 'Google belum dihubungkan',
    message:
      'Email Google belum dihubungkan ke akun Bantoo. Login dengan email & password, lalu hubungkan Google di menu Profil → Keamanan.',
  },
  oauth_2fa: {
    title: 'Login Google tidak tersedia',
    message:
      'Akun ini menggunakan 2FA. Login dengan email, password, dan kode Authenticator — login Google tidak tersedia.',
  },
  admin_google: {
    title: 'Login Google ditolak',
    message: 'Akun admin hanya dapat login dengan email dan password.',
  },
  account_inactive: {
    title: 'Akun tidak aktif',
    message: 'Akun tidak aktif. Hubungi dukungan Bantoo.',
  },
  google_email_missing: {
    title: 'Email Google tidak ditemukan',
    message: 'Google tidak mengirim alamat email. Coba akun Google lain.',
  },
  google_link_mismatch: {
    title: 'Gagal menghubungkan Google',
    message: 'Gagal menghubungkan Google. Silakan coba lagi dari halaman Profil.',
  },
  google_email_mismatch: {
    title: 'Email Google tidak cocok',
    message:
      'Email Google harus sama dengan email akun Bantoo Anda. Gunakan akun Google yang sesuai.',
  },
  google_already_linked: {
    title: 'Google sudah terhubung',
    message: 'Google sudah terhubung ke akun ini.',
  },
  teknisi_blocked: {
    title: 'Akun teknisi belum aktif',
    message: 'Akun teknisi belum dapat digunakan. Periksa status pendaftaran atau hubungi admin.',
  },
  coming_soon_admin_only: {
    title: 'Soft launch',
    message: 'Platform dalam soft launch. Hanya admin yang dapat login saat ini.',
  },
  AccessDenied: {
    title: 'Login Google ditolak',
    message:
      'Login Google ditolak. Pastikan akun sudah terdaftar dan Google sudah dihubungkan di Profil → Keamanan.',
  },
  Configuration: {
    title: 'Login Google belum siap',
    message: 'Login Google belum dikonfigurasi dengan benar. Hubungi administrator.',
  },
  OAuthSignin: {
    title: 'Gagal memulai login Google',
    message: 'Gagal memulai login Google. Coba lagi.',
  },
  OAuthCallback: {
    title: 'Gagal menyelesaikan login Google',
    message: 'Gagal menyelesaikan login Google. Coba lagi.',
  },
  OAuthCreateAccount: {
    title: 'Tidak dapat membuat akun via Google',
    message: 'Tidak dapat membuat akun via Google. Daftar melalui formulir terlebih dahulu.',
    showRegisterLinks: true,
  },
  CallbackRouteError: {
    title: 'Login Google gagal',
    message: 'Terjadi kesalahan saat login Google. Coba lagi.',
  },
}

export function loginOAuthErrorDetails(
  code: string | null | undefined,
): OAuthLoginErrorDetails | null {
  if (!code?.trim()) return null
  const details = LOGIN_OAUTH_ERROR_DETAILS[code] ?? LOGIN_OAUTH_ERROR_DETAILS.AccessDenied
  return { code: code as OAuthLoginErrorCode, ...details }
}

/** @deprecated Use loginOAuthErrorDetails().message */
export function loginOAuthErrorMessage(code: string | null | undefined): string | null {
  return loginOAuthErrorDetails(code)?.message ?? null
}
