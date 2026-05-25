'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { AuroraBackground } from '@/components/motion'
import { motion } from 'framer-motion'

function isSafeCallbackUrl(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//')
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [needs2FA, setNeeds2FA] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await login(email, password, needs2FA ? totp : undefined)

    if (result.requires2FA) {
      setNeeds2FA(true)
      setError(null)
      setIsLoading(false)
      return
    }

    if (!result.success) {
      setError(result.error || 'Login gagal')
      setIsLoading(false)
      return
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

  return (
    <motion.div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <AuroraBackground intensity="vivid" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <Card tone="glass" className="overflow-hidden">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 shadow-glow-primary">
              <Zap weight="fill" className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tightest">
                {needs2FA ? 'Verifikasi 2FA' : 'Masuk ke akun Anda'}
              </CardTitle>
              <CardDescription className="mt-1 text-surface-600">
                {needs2FA
                  ? 'Masukkan kode 6 digit dari Google Authenticator'
                  : 'Platform ekosistem teknisi handphone Indonesia'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
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
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={totp}
                      onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                      className="pl-11 text-center tracking-[0.3em]"
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

            {!needs2FA && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-surface-200" />
                  <span className="text-[11px] font-medium text-surface-500">atau</span>
                  <div className="h-px flex-1 bg-surface-200" />
                </div>
                <GoogleSignInButton
                  callbackUrl={
                    searchParams.get('callbackUrl') && isSafeCallbackUrl(searchParams.get('callbackUrl')!)
                      ? searchParams.get('callbackUrl')!
                      : undefined
                  }
                />
              </div>
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
              href="/"
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
