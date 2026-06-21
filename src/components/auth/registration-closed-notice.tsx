'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  TEKNISI_REGISTRATION_CLOSED_MESSAGE,
  USER_REGISTRATION_CLOSED_MESSAGE,
} from '@/lib/registration-control-shared'
import type { PublicFeatureFlags } from '@/lib/platform-settings-shared'
import { DEFAULT_PUBLIC_FEATURE_FLAGS } from '@/lib/platform-settings-shared'

type RegistrationClosedNoticeProps = {
  role: 'USER' | 'TEKNISI'
}

export function RegistrationClosedNotice({ role }: RegistrationClosedNoticeProps) {
  const message =
    role === 'USER' ? USER_REGISTRATION_CLOSED_MESSAGE : TEKNISI_REGISTRATION_CLOSED_MESSAGE
  const title = role === 'USER' ? 'Pendaftaran user ditutup' : 'Pendaftaran teknisi ditutup'

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 leading-relaxed">{message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/login">
          <Button type="button" variant="outline" size="sm">
            Ke halaman login
          </Button>
        </Link>
        <Link href="/">
          <Button type="button" variant="ghost" size="sm">
            Kembali ke beranda
          </Button>
        </Link>
      </div>
    </div>
  )
}

export function useRegistrationFlags() {
  const [flags, setFlags] = useState<Pick<
    PublicFeatureFlags,
    'userRegistrationEnabled' | 'teknisiRegistrationEnabled'
  > | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/platform/feature-flags')
        const json = await res.json()
        if (cancelled || !json.success) return
        setFlags({
          userRegistrationEnabled:
            json.data.userRegistrationEnabled ??
            DEFAULT_PUBLIC_FEATURE_FLAGS.userRegistrationEnabled,
          teknisiRegistrationEnabled:
            json.data.teknisiRegistrationEnabled ??
            DEFAULT_PUBLIC_FEATURE_FLAGS.teknisiRegistrationEnabled,
        })
      } catch {
        if (!cancelled) {
          setFlags({
            userRegistrationEnabled: DEFAULT_PUBLIC_FEATURE_FLAGS.userRegistrationEnabled,
            teknisiRegistrationEnabled: DEFAULT_PUBLIC_FEATURE_FLAGS.teknisiRegistrationEnabled,
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return flags
}
