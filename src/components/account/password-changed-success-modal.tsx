'use client'

import { motion } from 'framer-motion'
import { completeClientLogout } from '@/lib/auth/client-logout'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, Shield } from '@/lib/icons'

type PasswordChangedSuccessModalProps = {
  open: boolean
}

export function PasswordChangedSuccessModal({ open }: PasswordChangedSuccessModalProps) {
  if (!open) return null

  const goToLogin = () => {
    void completeClientLogout({ callbackUrl: '/login?reason=password_changed' }).then(() => {
      window.location.assign('/login?reason=password_changed')
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-changed-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-surface-200/80 bg-white p-8 text-center shadow-[0_32px_80px_-24px_rgba(16,185,129,0.35)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-12 h-36 w-36 rounded-full bg-emerald-100/60 blur-3xl"
        />

        <div className="relative">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-600 shadow-[0_12px_32px_-12px_rgba(16,185,129,0.55)]">
            <CheckCircle className="h-8 w-8 text-white" weight="fill" />
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-700">
            Keamanan akun
          </p>
          <h2 id="password-changed-title" className="mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Password berhasil diganti
          </h2>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-surface-600">
            Silahkan login ulang ke halaman login dengan password baru Anda.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-left">
            <Shield className="h-4 w-4 shrink-0 text-primary-600" />
            <p className="text-[11px] leading-relaxed text-primary-800">
              Sesi lama otomatis diakhiri demi keamanan akun Anda.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="mt-6 w-full gap-2"
            onClick={goToLogin}
          >
            Login
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
