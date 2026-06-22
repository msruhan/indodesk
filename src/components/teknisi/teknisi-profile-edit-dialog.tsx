'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { X } from '@/lib/icons'
import { cn } from '@/lib/utils'

type TeknisiProfileEditDialogProps = {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  size?: 'md' | 'lg' | 'xl'
}

const SIZE_CLASS = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
} as const

export function TeknisiProfileEditDialog({
  open,
  title,
  description,
  onClose,
  children,
  size = 'lg',
}: TeknisiProfileEditDialogProps) {
  if (!open) return null

  return (
    <motion.div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Tutup"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-surface-200/80 bg-white shadow-soft-lg sm:rounded-3xl',
          SIZE_CLASS[size],
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-surface-200/70 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-surface-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </motion.div>
  )
}
