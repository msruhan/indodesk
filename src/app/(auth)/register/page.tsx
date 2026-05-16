'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { Zap, Mail, Lock, User } from '@/lib/icons'
import { AuroraBackground } from '@/components/motion'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const roles = [
  { id: 'USER' as const, label: 'User' },
  { id: 'TEKNISI' as const, label: 'Teknisi' },
] as const

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'USER' | 'TEKNISI'>('USER')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Password tidak sama!')
      return
    }

    setIsLoading(true)
    const result = await register(name, email, password, role)

    if (!result.success) {
      setError(result.error || 'Registrasi gagal')
      setIsLoading(false)
      return
    }

    // Redirect based on role
    if (role === 'TEKNISI') router.push('/teknisi/dashboard')
    else router.push('/user/akun')
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
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 shadow-glow-primary">
              <Zap weight="fill" className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tightest">
                Daftar akun baru
              </CardTitle>
              <CardDescription className="mt-1 text-surface-600">
                Bergabung dengan ekosistem teknisi handphone
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700">
                  Daftar sebagai
                </label>
                <div className="relative grid grid-cols-2 gap-1 rounded-2xl border border-surface-200/70 bg-white/60 p-1 shadow-soft-xs backdrop-blur-md">
                  {roles.map((r) => {
                    const active = role === r.id
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={cn(
                          'relative h-9 rounded-xl text-sm font-medium transition-colors',
                          active ? 'text-white' : 'text-surface-600 hover:text-ink',
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="register-role-pill"
                            className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-soft-md"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{r.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Name */}
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

              {/* Email */}
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

              {/* Password */}
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

              {/* Confirm Password */}
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
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <div className="text-center text-sm text-surface-600">
              Sudah punya akun?{' '}
              <Link
                href="/login"
                className="font-medium text-primary-700 hover:text-primary-800 hover:underline underline-offset-4"
              >
                Masuk di sini
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
    </div>
  )
}
