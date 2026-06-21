'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
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
import { Mail, Lock, User, Wrench } from '@/lib/icons'
import { BrandLogo } from '@/components/brand/brand-logo'
import { AuroraBackground } from '@/components/motion'
import { motion } from 'framer-motion'
import { GoogleRegisterDivider } from '@/components/auth/google-register-divider'
import { RegisterOAuthErrorAlert } from '@/components/auth/register-oauth-error-alert'
import {
  RegistrationClosedNotice,
  useRegistrationFlags,
} from '@/components/auth/registration-closed-notice'
import { useComingSoonActive } from '@/hooks/use-coming-soon-active'

export default function RegisterPage() {
  const { register } = useAuth()
  const registrationFlags = useRegistrationFlags()
  const comingSoonActive = useComingSoonActive()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Password tidak sama!')
      return
    }

    setIsLoading(true)
    const result = await register(name, email, password)

    if (!result.success) {
      setError(result.error || 'Registrasi gagal')
      setIsLoading(false)
      return
    }

    setSubmitted(true)
    setIsLoading(false)
  }

  if (submitted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
        <AuroraBackground intensity="vivid" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md"
        >
          <Card tone="glass" className="overflow-hidden">
            <CardHeader className="space-y-3 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                <Mail className="h-7 w-7 text-emerald-600" />
              </div>
              <CardTitle className="text-xl font-semibold">Periksa Email Anda</CardTitle>
              <CardDescription className="text-surface-600">
                Kami telah mengirim tautan verifikasi ke <strong>{email}</strong>. Klik tautan
                tersebut untuk mengaktifkan akun, lalu login.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-3 pb-8">
              <Link href="/login?verify=sent" className="w-full">
                <Button variant="primary" size="lg" className="w-full">
                  Ke halaman login
                </Button>
              </Link>
              <Link href="/" className="text-center text-sm text-surface-500 hover:text-ink">
                ← Kembali ke beranda
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <AuroraBackground intensity="vivid" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <Card tone="glass" className="overflow-hidden">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto">
              <BrandLogo variant="wordmark" wordmarkClassName="mx-auto h-[4.5rem] scale-[1.15]" className="items-center" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tightest">
                Daftar sebagai User
              </CardTitle>
              <CardDescription className="mt-1 text-surface-600">
                Buat akun pelanggan untuk belanja, konsultasi, dan layanan
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <RegisterOAuthErrorAlert />

            {registrationFlags && !registrationFlags.userRegistrationEnabled ? (
              <RegistrationClosedNotice role="USER" />
            ) : (
              <>
            <GoogleRegisterDivider role="USER" callbackUrl="/register/lengkapi" className="mb-6" />

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-surface-700">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className={authFieldIconClass} strokeWidth={2} aria-hidden />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-11"
                    required
                  />
                </div>
              </div>

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

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-surface-700"
                >
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className={authFieldIconClass} strokeWidth={2} aria-hidden />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Memproses…' : 'Daftar'}
              </Button>
            </form>

            <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50/60 p-4">
              <div className="flex items-start gap-3">
                <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-ink">Anda teknisi handphone?</p>
                  <p className="mt-1 text-xs text-surface-600">
                    Daftar melalui formulir khusus teknisi. Verifikasi email dulu, lalu tunggu
                    persetujuan admin.
                  </p>
                  {registrationFlags?.teknisiRegistrationEnabled !== false ? (
                    <Link
                      href="/register/teknisi"
                      className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline"
                    >
                      Daftar sebagai Teknisi →
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            {!comingSoonActive && (
              <div className="text-center text-sm text-surface-600">
                Sudah punya akun?{' '}
                <Link
                  href="/login"
                  className="font-medium text-primary-700 hover:text-primary-800 hover:underline underline-offset-4"
                >
                  Masuk di sini
                </Link>
              </div>
            )}
            <Link
              href={comingSoonActive ? '/coming-soon' : '/'}
              className="text-center text-sm text-surface-500 hover:text-ink transition-colors"
            >
              ← Kembali ke beranda
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
