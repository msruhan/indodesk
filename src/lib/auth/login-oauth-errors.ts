/** Pesan error OAuth/Google di halaman login (`?error=`). */
const LOGIN_OAUTH_ERROR_MESSAGES: Record<string, string> = {
  not_registered:
    'Akun dengan email Google ini belum terdaftar. Silakan daftar terlebih dahulu melalui formulir.',
  google_not_linked:
    'Email Google belum dihubungkan ke akun IndoTeknizi. Login dengan email & password, lalu hubungkan Google di menu Profil → Keamanan.',
  OAuthAccountNotLinked:
    'Email Google belum dihubungkan ke akun IndoTeknizi. Login dengan email & password, lalu hubungkan Google di menu Profil → Keamanan.',
  oauth_2fa:
    'Akun ini menggunakan 2FA. Login dengan email, password, dan kode Authenticator — login Google tidak tersedia.',
  admin_google:
    'Akun admin hanya dapat login dengan email dan password.',
  account_inactive: 'Akun tidak aktif. Hubungi dukungan IndoTeknizi.',
  google_email_missing: 'Google tidak mengirim alamat email. Coba akun Google lain.',
  google_link_mismatch: 'Gagal menghubungkan Google. Silakan coba lagi dari halaman Profil.',
  google_email_mismatch:
    'Email Google harus sama dengan email akun IndoTeknizi Anda. Gunakan akun Google yang sesuai.',
  google_already_linked: 'Google sudah terhubung ke akun ini.',
  teknisi_blocked:
    'Akun teknisi belum dapat digunakan. Periksa status pendaftaran atau hubungi admin.',
  AccessDenied:
    'Login Google ditolak. Pastikan akun sudah terdaftar dan Google sudah dihubungkan di Profil.',
  Configuration: 'Login Google belum dikonfigurasi dengan benar. Hubungi administrator.',
  OAuthSignin: 'Gagal memulai login Google. Coba lagi.',
  OAuthCallback: 'Gagal menyelesaikan login Google. Coba lagi.',
  OAuthCreateAccount: 'Tidak dapat membuat akun via Google. Daftar melalui formulir terlebih dahulu.',
  CallbackRouteError: 'Terjadi kesalahan saat login Google. Coba lagi.',
}

export function loginOAuthErrorMessage(code: string | null | undefined): string | null {
  if (!code?.trim()) return null
  return LOGIN_OAUTH_ERROR_MESSAGES[code] ?? LOGIN_OAUTH_ERROR_MESSAGES.AccessDenied
}
