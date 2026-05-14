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
import { Zap, Mail, Lock } from '@/lib/icons'
import { AuroraBackground } from '@/components/motion'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const roles = [
  { id: 'user', label: 'User' },
  { id: 'teknisi', label: 'Teknisi' },
  { id: 'admin', label: 'Admin' },
] as const

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'teknisi' | 'user'>('user')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(email, password, role)
      if (role === 'admin') router.push('/admin/dashboard')
      else if (role === 'teknisi') router.push('/teknisi/dashboard')
      else router.push('/user/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
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
              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700">
                  Masuk sebagai
                </label>
                <div className="relative grid grid-cols-3 gap-1 rounded-2xl border border-surface-200/70 bg-white/60 p-1 shadow-soft-xs backdrop-blur-md">
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
                            layoutId="login-role-pill"
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

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-surface-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
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
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
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
