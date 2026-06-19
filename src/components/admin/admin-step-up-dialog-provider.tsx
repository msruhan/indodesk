'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authFieldIconClass } from '@/components/ui/auth-field-icon'
import { Lock, Shield, X } from '@/lib/icons'
import {
  registerAdminStepUpDialog,
  type AdminStepUpCredentials,
} from '@/lib/admin-step-up-bridge'

export function AdminStepUpDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const resolveRef = useRef<((value: AdminStepUpCredentials | null) => void) | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setConfirmPassword('')
    setTotp('')
    setFieldError(null)
  }, [])

  const close = useCallback(
    (result: AdminStepUpCredentials | null) => {
      setOpen(false)
      resolveRef.current?.(result)
      resolveRef.current = null
      reset()
    },
    [reset],
  )

  const invoke = useCallback(
    (twoFa: boolean): Promise<AdminStepUpCredentials | null> => {
      setTwoFactorEnabled(twoFa)
      reset()
      setOpen(true)
      return new Promise((resolve) => {
        resolveRef.current = resolve
      })
    },
    [reset],
  )

  useEffect(() => {
    registerAdminStepUpDialog(invoke)
    return () => registerAdminStepUpDialog(null)
  }, [invoke])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120)
    return () => window.clearTimeout(timer)
  }, [open, twoFactorEnabled])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (twoFactorEnabled) {
      const code = totp.trim()
      if (!code) {
        setFieldError('Kode 2FA wajib diisi')
        return
      }
      close({ totp: code })
      return
    }
    if (!confirmPassword.trim()) {
      setFieldError('Password admin wajib diisi')
      return
    }
    close({ confirmPassword })
  }

  const handleCancel = () => close(null)

  return (
    <>
      {children}
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              key="admin-step-up-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[110] bg-ink/45 backdrop-blur-sm"
              onClick={handleCancel}
            />

            <motion.div
              key="admin-step-up-dialog"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-[111] flex items-center justify-center p-4"
            >
              <form
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-surface-200/80 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
              >
                <button
                  type="button"
                  onClick={handleCancel}
                  className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-ink"
                  aria-label="Tutup"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="border-b border-surface-100 bg-gradient-to-br from-primary-50/80 via-white to-surface-50 px-6 pb-5 pt-8 text-center">
                  <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 ring-4 ring-white">
                    <Shield className="h-8 w-8 text-primary-700" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-ink">
                    Konfirmasi identitas admin
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-600">
                    {twoFactorEnabled
                      ? 'Masukkan kode 2FA dari authenticator untuk melanjutkan aksi sensitif.'
                      : 'Masukkan password login admin Anda untuk melanjutkan aksi sensitif.'}
                  </p>
                </div>

                <div className="space-y-4 px-6 py-5">
                  {fieldError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {fieldError}
                    </div>
                  ) : null}

                  {twoFactorEnabled ? (
                    <div className="space-y-2">
                      <label htmlFor="admin-step-up-totp" className="text-sm font-medium text-surface-700">
                        Kode 2FA
                      </label>
                      <div className="relative">
                        <Shield className={authFieldIconClass} strokeWidth={2} aria-hidden />
                        <Input
                          ref={inputRef}
                          id="admin-step-up-totp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="000000"
                          value={totp}
                          onChange={(e) => {
                            setTotp(e.target.value)
                            setFieldError(null)
                          }}
                          className="pl-11 text-center tracking-[0.2em]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label
                        htmlFor="admin-step-up-password"
                        className="text-sm font-medium text-surface-700"
                      >
                        Password admin
                      </label>
                      <div className="relative">
                        <Lock className={authFieldIconClass} strokeWidth={2} aria-hidden />
                        <Input
                          ref={inputRef}
                          id="admin-step-up-password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            setFieldError(null)
                          }}
                          className="pl-11"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      className="h-11 flex-1 rounded-full"
                      onClick={handleCancel}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="default"
                      className="h-11 flex-1 rounded-full"
                    >
                      Konfirmasi
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
