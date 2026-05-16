'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { Zap, Mail, Lock } from '@/lib/icons'
import { AuroraBackground } from '@/components/motion'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await login(email, password)

    if (!result.success) {
      setError(result.error || 'Login gagal')
      setIsLoading(false)
      return
    }

    const session = await getSession()
    const role = session?.user?.role as UserRole | undefined
    const destination =
      role === 'ADMIN'
        ? '/admin/dashboard'
        : role === 'TEKNISI'
          ? '/teknisi/dashboard'
          : '/user/akun'

    router.push(destination)
    router.refresh()
    setIsLoading(false)
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
                Masuk ke akun Anda
              </CardTitle>
              <CardDescription className="mt-1 text-surface-600">
                Platform ekosistem teknisi handphone Indonesia
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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Memproses…' : 'Masuk'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <div className="text-center text-sm text-surface-600">
              Belum punya akun?{' '}
              <Link
                href="/register"
                className="font-medium text-primary-700 hover:text-primary-800 hover:underline underline-offset-4"
              >
                Daftar sekarang
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
