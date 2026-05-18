'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ChevronLeft } from '@/lib/icons'
import { homePathForRole } from '@/lib/role-routes'
import { getNavReturnPath } from '@/lib/nav-return-path'
import { cn } from '@/lib/utils'

type BackButtonProps = {
  /** Dipakai jika tidak ada riwayat browser dan tidak ada path tersimpan. */
  fallbackHref?: string
  className?: string
  'aria-label'?: string
}

export function BackButton({
  fallbackHref,
  className,
  'aria-label': ariaLabel = 'Kembali',
}: BackButtonProps) {
  const router = useRouter()
  const { user } = useAuth()

  const defaultFallback =
    fallbackHref ?? (user ? homePathForRole(user.role) : '/marketplace')

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    const stored = getNavReturnPath()
    router.push(stored ?? defaultFallback)
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-surface-200/70 bg-white text-surface-600 transition-colors hover:text-ink',
        className,
      )}
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  )
}
