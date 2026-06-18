'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import type { UserProfileDto } from '@/lib/user-profile-serializer'

type GoogleLinkCardProps = {
  profile: UserProfileDto
  onChanged: () => void | Promise<void>
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function GoogleLinkCard({ profile, onChanged }: GoogleLinkCardProps) {
  const pathname = usePathname()
  const { flags, loading: flagsLoading } = useFeatureFlags()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (flagsLoading || !flags.googleAuthEnabled || profile.role === 'ADMIN') {
    return null
  }

  const handleLink = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/google/link-intent', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setMessage(json.error ?? 'Gagal memulai penghubungan Google')
        return
      }
      const callbackUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${pathname}?google=linked`
          : pathname
      await signIn('google', { callbackUrl })
    } catch {
      setMessage('Gagal menghubungkan ke Google')
    } finally {
      setBusy(false)
    }
  }

  const handleUnlink = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/google/unlink', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        setMessage(json.error ?? 'Gagal memutus Google')
        return
      }
      setMessage('Google berhasil diputus dari akun.')
      await onChanged()
    } catch {
      setMessage('Gagal memutus Google')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="shadow-soft-xs">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GoogleMark className="h-4 w-4" />
            <h3 className="text-sm font-bold text-ink">Akun Google</h3>
          </div>
          <Badge variant={profile.googleLinked ? 'success' : 'warning'} className="text-[10px]">
            {profile.googleLinked ? 'Terhubung' : 'Belum terhubung'}
          </Badge>
        </div>
        <p className="mb-3 text-[13px] text-surface-600">
          {profile.googleLinked
            ? `Login cepat dengan Google tersedia untuk ${profile.email}.`
            : 'Hubungkan akun Google dengan email yang sama agar bisa login via tombol "Lanjutkan dengan Google".'}
        </p>
        {profile.twoFactorEnabled && (
          <p className="mb-3 text-xs text-amber-800">
            Akun dengan 2FA aktif tidak dapat login via Google.
          </p>
        )}
        {message && (
          <p
            className={cn(
              'mb-3 text-xs',
              message.includes('berhasil') ? 'text-primary-700' : 'text-rose-600',
            )}
          >
            {message}
          </p>
        )}
        {profile.googleLinked ? (
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !profile.hasPassword}
            onClick={() => void handleUnlink()}
          >
            {busy ? 'Memproses…' : 'Putuskan Google'}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={busy || profile.twoFactorEnabled}
            onClick={() => void handleLink()}
          >
            <GoogleMark className="h-4 w-4" />
            {busy ? 'Membuka Google…' : 'Hubungkan Google'}
          </Button>
        )}
        {!profile.hasPassword && profile.googleLinked && (
          <p className="mt-2 text-xs text-surface-500">
            Akun hanya via Google — set password dulu jika ingin memutus koneksi.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
