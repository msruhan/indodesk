'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { getSession } from 'next-auth/react'
import { useAuth, type UserRole } from '@/contexts/auth-context'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authFieldIconClass } from '@/components/ui/auth-field-icon'
import { Zap, Mail, Lock, Shield } from '@/lib/icons'
import { BrandLogo } from '@/components/brand/brand-logo'
import { GoogleAuthDivider } from '@/components/auth/google-auth-divider'
import { OAuthLoginErrorAlert } from '@/components/auth/oauth-login-error-alert'
import { loginOAuthErrorDetails, type OAuthLoginErrorDetails } from '@/lib/auth/login-oauth-errors'
import {
  COMING_SOON_LOGIN_BANNER_TEXT,
  COMING_SOON_LOGIN_BLOCKED_MESSAGE,
  COMING_SOON_LOGIN_BLOCKED_TITLE,
} from '@/lib/coming-soon-shared'
import { AuroraBackground } from '@/components/motion'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const REMEMBER_EMAIL_KEY = 'bantoo_login_remember_email'

function isSafeCallbackUrl(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//')
}

function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Konfirmasi password tidak sama')
      return
    }
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Gagal reset password')
        return
      }
      setMessage(json.data?.message ?? 'Password berhasil diubah. Silakan login.')
    } catch {
      setError('Gagal menghubungi server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleReset} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}{' '}
          <Link href="/login" className="font-medium underline">
            Login
          </Link>
        </div>
      )}
      <Input
        type="password"
        placeholder="Password baru"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={10}
      />
      <Input
        type="password"
        placeholder="Ulangi password baru"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={10}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Menyimpan…' : 'Simpan password baru'}
      </Button>
    </form>
  )
}

function VerifyStatusBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [banner, setBanner] = useState<{
    tone: 'info' | 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    const verify = searchParams.get('verify')
    if (!verify) return

    const message = (() => {
      switch (verify) {
        case 'sent':
          return {
            tone: 'info' as const,
            text: 'Kami telah mengirim email verifikasi. Klik tautan di inbox Anda untuk mengaktifkan akun.',
          }
        case 'success':
          return {
            tone: 'success' as const,
            text: 'Email berhasil diverifikasi. Akun Anda sudah aktif — silakan login.',
          }
        case 'teknisi_pending':
          return {
            tone: 'success' as const,
            text: 'Email berhasil diverifikasi. Pendaftaran teknisi Anda sedang ditinjau admin — Anda dapat login setelah disetujui.',
          }
        case 'invalid':
          return {
            tone: 'error' as const,
            text: 'Tautan verifikasi tidak valid atau sudah kedaluwarsa.',
          }
        case 'missing':
          return {
            tone: 'error' as const,
            text: 'Tautan verifikasi tidak lengkap.',
          }
        default:
          return null
      }
    })()

    if (message) setBanner(message)

    const next = new URLSearchParams(searchParams.toString())
    next.delete('verify')
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchParams, router, pathname])

  if (!banner) return null

  const className =
    banner.tone === 'success'
      ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
      : banner.tone === 'error'
        ? 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'
        : 'rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900'

  return <div className={className}>{banner.text}</div>
}

function OAuthErrorSync({ onError }: { onError: (details: OAuthLoginErrorDetails) => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const code = searchParams.get('error')
    const details = loginOAuthErrorDetails(code)
    if (!details) return
    onError(details)
    toast.error(details.title, { description: details.message })
    const next = new URLSearchParams(searchParams.toString())
    next.delete('error')
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchParams, router, pathname, onError])

  return null
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const resetToken = searchParams.get('resetToken')
  const idleLogout = searchParams.get('reason') === 'idle'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [totp, setTotp] = useState('')
  const [needs2FA, setNeeds2FA] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [oauthError, setOauthError] = useState<OAuthLoginErrorDetails | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)
  const [comingSoonActive, setComingSoonActive] = useState(false)

  useEffect(() => {
    void fetch('/api/public/coming-soon')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.enabled) setComingSoonActive(true)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY)
      if (savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const handleOAuthError = useCallback((details: OAuthLoginErrorDetails) => {
    setOauthError(details)
    setError(null)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setOauthError(null)
    setInfo(null)
    setEmailNotVerified(false)

    const result = await login(email, password, needs2FA ? totp : undefined, rememberMe)

    if (result.requires2FA) {
      setNeeds2FA(true)
      setError(null)
      setIsLoading(false)
      return
    }

    if (!result.success) {
      setError(result.error || 'Login gagal')
      if (result.code === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true)
      }
      setIsLoading(false)
      return
    }

    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim().toLowerCase())
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      }
    } catch {
      /* ignore */
    }

    const session = await getSession()
    const role = session?.user?.role as UserRole | undefined
    const callbackUrl = searchParams.get('callbackUrl')
    const destination =
      role === 'ADMIN'
        ? '/admin/dashboard'
        : role === 'TEKNISI'
          ? '/teknisi/dashboard'
          : '/user/dashboard'

    if (callbackUrl && isSafeCallbackUrl(callbackUrl)) {
      router.push(callbackUrl)
    } else {
      router.push(destination)
    }
    router.refresh()
    setIsLoading(false)
  }

  const handleResendVerification = async () => {
    if (!email.trim() || !password) {
      setError('Isi email dan password terlebih dahulu.')
      return
    }

    setResendingVerification(true)
    setError(null)
    setInfo(null)

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Gagal mengirim email verifikasi')
        return
      }
      setInfo(json.data?.message ?? 'Email verifikasi telah dikirim. Periksa inbox Anda.')
      setEmailNotVerified(false)
    } catch {
      setError('Gagal menghubungi server')
    } finally {
      setResendingVerification(false)
    }
  }

  return (
    <motion.div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <AuroraBackground intensity="vivid" />

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <Card tone="glass" className="overflow-hidden">
          <CardHeader className="space-y-4 text-center">
            <BrandLogo
              variant="wordmark"
              align="center"
              wordmarkClassName="h-[4.5rem] sm:max-w-[20rem]"
            />
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tightest">
                {resetToken ? 'Reset password' : needs2FA ? 'Verifikasi 2FA' : 'Masuk ke akun Anda'}
              </CardTitle>
              <CardDescription className="mt-1 text-surface-600">
                {resetToken
                  ? 'Buat password baru untuk akun Anda'
                  : needs2FA
                    ? 'Kode 6 digit dari Authenticator, atau kode cadangan (XXXX-XXXX)'
                    : comingSoonActive
                      ? 'Login belum dibuka sampai peluncuran resmi'
                      : 'Platform ekosistem teknisi handphone Indonesia'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <OAuthErrorSync onError={handleOAuthError} />
            <VerifyStatusBanner />
            {comingSoonActive && !resetToken && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="leading-relaxed">{COMING_SOON_LOGIN_BANNER_TEXT}</p>
              </div>
            )}
            {resetToken ? (
              <ResetPasswordForm token={resetToken} />
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {idleLogout && !error && !oauthError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Sesi berakhir karena tidak ada aktivitas selama 2 jam. Silakan login kembali.
                </div>
              )}
              {oauthError && <OAuthLoginErrorAlert details={oauthError} />}
              {error && !oauthError && (
                <div
                  className={
                    error === COMING_SOON_LOGIN_BLOCKED_MESSAGE
                      ? 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'
                      : 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'
                  }
                >
                  {error === COMING_SOON_LOGIN_BLOCKED_MESSAGE ? (
                    <>
                      <p className="font-semibold">{COMING_SOON_LOGIN_BLOCKED_TITLE}</p>
                      <p className="mt-1 leading-relaxed">{error}</p>
                    </>
                  ) : (
                    error
                  )}
                </div>
              )}
              {info && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {info}
                </div>
              )}
              {emailNotVerified && (
                <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900">
                  <p>Belum menerima email? Kami bisa kirim ulang tautan verifikasi ke inbox Anda.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    disabled={resendingVerification || isLoading}
                    onClick={() => void handleResendVerification()}
                  >
                    {resendingVerification ? 'Mengirim…' : 'Kirim ulang email verifikasi'}
                  </Button>
                </div>
              )}

              {!needs2FA ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-surface-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className={authFieldIconClass} strokeWidth={2} aria-hidden />
                      <Input
                        id="email"
                        type="email"
                        placeholder="nama@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-surface-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className={authFieldIconClass} strokeWidth={2} aria-hidden />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-surface-700">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        />
                        Ingat saya
                      </label>
                      <Link
                        href="/lupa-password"
                        className="text-xs text-primary-700 hover:underline"
                      >
                        Lupa password?
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="totp" className="text-sm font-medium text-surface-700">
                    Kode Google Authenticator
                  </label>
                  <div className="relative">
                    <Shield className={authFieldIconClass} strokeWidth={2} aria-hidden />
                    <Input
                      id="totp"
                      placeholder="000000 atau XXXX-XXXX"
                      value={totp}
                      onChange={(e) => setTotp(e.target.value)}
                      className="pl-11 text-center tracking-widest"
                      required
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    className="text-xs text-primary-700 hover:underline"
                    onClick={() => {
                      setNeeds2FA(false)
                      setTotp('')
                      setError(null)
                    }}
                  >
                    ← Kembali ke email & password
                  </button>
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? 'Memproses…' : needs2FA ? 'Verifikasi & Masuk' : 'Masuk'}
              </Button>
            </form>
            )}

            {!resetToken && !needs2FA && !comingSoonActive && (
              <GoogleAuthDivider
                callbackUrl={
                  searchParams.get('callbackUrl') && isSafeCallbackUrl(searchParams.get('callbackUrl')!)
                    ? searchParams.get('callbackUrl')!
                    : '/auth/continue'
                }
              />
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <div className="text-center text-sm text-surface-600">
              Belum punya akun?{' '}
              <Link
                href="/register"
                className="font-medium text-primary-700 hover:text-primary-800 hover:underline underline-offset-4"
              >
                Daftar user
              </Link>
              {' · '}
              <Link
                href="/register/teknisi"
                className="font-medium text-primary-700 hover:text-primary-800 hover:underline underline-offset-4"
              >
                Daftar teknisi
              </Link>
            </div>
            <Link
              href={comingSoonActive ? '/coming-soon' : '/'}
              className="text-center text-sm text-surface-500 hover:text-ink transition-colors"
            >
              ← Kembali ke beranda
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <motion.div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
          <AuroraBackground intensity="vivid" />
          <p className="text-sm text-surface-600">Memuat...</p>
        </motion.div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
