import { loginOAuthErrorDetails } from '@/lib/auth/login-oauth-errors'

export type RegisterOAuthErrorDetails = {
  code: string
  title: string
  message: string
  showLoginLink?: boolean
  showLengkapiLink?: boolean
}

const REGISTER_OAUTH_ERROR_DETAILS: Record<string, Omit<RegisterOAuthErrorDetails, 'code'>> = {
  google_register_expired: {
    title: 'Sesi pendaftaran Google habis',
    message:
      'Sesi pendaftaran Google sudah kedaluwarsa. Klik "Lanjutkan dengan Google" lagi atau isi formulir di bawah.',
  },
  email_already_registered: {
    title: 'Email sudah terdaftar',
    message:
      'Email Google ini sudah terdaftar di Bantoo. Login ke akun Anda atau gunakan email Google lain.',
    showLoginLink: true,
  },
  google_register_failed: {
    title: 'Pendaftaran Google gagal',
    message: 'Tidak dapat melanjutkan pendaftaran via Google. Coba lagi atau isi formulir di bawah.',
  },
  teknisi_profile_incomplete: {
    title: 'Lengkapi profil teknisi',
    message:
      'Akun Google sudah terhubung, tetapi formulir profil teknisi belum lengkap. Lanjutkan pengisian untuk menyelesaikan pendaftaran.',
    showLengkapiLink: true,
  },
}

export function registerOAuthErrorDetails(
  code: string | null | undefined,
): RegisterOAuthErrorDetails | null {
  if (!code?.trim()) return null

  const mapped = REGISTER_OAUTH_ERROR_DETAILS[code]
  if (mapped) return { code, ...mapped }

  const loginDetails = loginOAuthErrorDetails(code)
  if (loginDetails) {
    return {
      code,
      title: loginDetails.title,
      message: loginDetails.message,
      showLoginLink: true,
    }
  }

  return null
}
