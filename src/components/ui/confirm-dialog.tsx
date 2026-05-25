'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Bell, CheckCircle, HelpCircle, X, XCircle } from '@/lib/icons'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type DialogVariant = 'danger' | 'warning' | 'info' | 'success' | 'notification'

type ConfirmOptions = {
  title: string
  description?: string
  variant?: DialogVariant
  confirmLabel?: string
  cancelLabel?: string
  /** Hide cancel button (for info/success alerts) */
  hideCancel?: boolean
}

type ConfirmResult = boolean

/* -------------------------------------------------------------------------- */
/* Context                                                                     */
/* -------------------------------------------------------------------------- */

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<ConfirmResult>
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider')
  return ctx.confirm
}

/** Dialog informasi satu tombol (gaya notifikasi). */
export function useAlert() {
  const confirm = useConfirm()
  return useCallback(
    (opts: Omit<ConfirmOptions, 'hideCancel' | 'cancelLabel'>) =>
      confirm({
        ...opts,
        hideCancel: true,
        confirmLabel: opts.confirmLabel ?? 'OK',
      }),
    [confirm],
  )
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                    */
/* -------------------------------------------------------------------------- */

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<ConfirmResult> => {
    setOptions(opts)
    setOpen(true)
    return new Promise<ConfirmResult>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setOpen(false)
    resolveRef.current?.(true)
    resolveRef.current = null
  }, [])

  const handleCancel = useCallback(() => {
    setOpen(false)
    resolveRef.current?.(false)
    resolveRef.current = null
  }, [])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {open && options && (
          <ConfirmDialogUI
            options={options}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Dialog UI                                                                   */
/* -------------------------------------------------------------------------- */

const variantConfig: Record<DialogVariant, {
  icon: typeof AlertTriangle
  iconBg: string
  iconColor: string
  confirmVariant: 'destructive' | 'primary' | 'default'
}> = {
  danger: {
    icon: XCircle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    confirmVariant: 'destructive',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    confirmVariant: 'default',
  },
  info: {
    icon: HelpCircle,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    confirmVariant: 'primary',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
    confirmVariant: 'primary',
  },
  notification: {
    icon: Bell,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    confirmVariant: 'primary',
  },
}

function ConfirmDialogUI({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions
  onConfirm: () => void
  onCancel: () => void
}) {
  const variant = options.variant ?? 'danger'
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="confirm-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <motion.div
        key="confirm-dialog"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
      >
        <div
          className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-surface-200/80 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-ink"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-6 pb-2 pt-8 text-center">
            <div
              className={cn(
                'mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ring-4 ring-white',
                config.iconBg,
              )}
            >
              <Icon className={cn('h-8 w-8', config.iconColor)} />
            </div>

            <h3 className="text-lg font-bold tracking-tight text-ink">{options.title}</h3>

            {options.description && (
              <p className="mt-2 text-sm leading-relaxed text-surface-600">{options.description}</p>
            )}
          </div>

          <div className="flex gap-3 px-6 pb-6 pt-4">
            {!options.hideCancel && (
              <Button
                type="button"
                variant="outline"
                size="default"
                className="h-11 flex-1 rounded-full"
                onClick={onCancel}
              >
                {options.cancelLabel ?? 'Batal'}
              </Button>
            )}
            <Button
              type="button"
              variant={config.confirmVariant}
              size="default"
              className={cn('h-11 rounded-full', options.hideCancel ? 'w-full' : 'flex-1')}
              onClick={onConfirm}
            >
              {options.confirmLabel ?? 'Konfirmasi'}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
