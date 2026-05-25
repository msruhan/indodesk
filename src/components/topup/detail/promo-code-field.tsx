'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle, X } from '@/lib/icons'
import { TOPUP_PROMO_CODES } from '@/lib/topup-order-config'
import { formatIDR } from '@/lib/topup-utils'
import { cn } from '@/lib/utils'

interface PromoCodeFieldProps {
  value: string
  onChange: (val: string) => void
  /** Subtotal used to compute the displayed discount preview */
  subtotal: number
}

export function PromoCodeField({ value, onChange, subtotal }: PromoCodeFieldProps) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)

  const promo = value ? TOPUP_PROMO_CODES[value.toUpperCase()] : null
  const discount = promo
    ? promo.type === 'percent'
      ? Math.round((subtotal * promo.value) / 100)
      : promo.value
    : 0

  const apply = () => {
    const code = draft.trim().toUpperCase()
    if (!code) {
      setError('Masukkan kode promo')
      return
    }
    if (!TOPUP_PROMO_CODES[code]) {
      setError('Kode promo tidak valid')
      return
    }
    setError(null)
    onChange(code)
  }

  const clear = () => {
    setDraft('')
    setError(null)
    onChange('')
  }

  if (promo && value) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/60 px-3 py-2"
      >
        <CheckCircle weight="fill" className="h-4 w-4 flex-shrink-0 text-primary-600" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-primary-700">
            {value.toUpperCase()} · {promo.label}
          </p>
          <p className="text-[11px] text-primary-700/80 tabular-nums">
            Hemat {formatIDR(discount)}
          </p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-primary-700 transition-colors hover:bg-primary-100"
          aria-label="Hapus kode promo"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value.toUpperCase())
            setError(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), apply())}
          placeholder="Kode promo"
          className={cn('h-10 text-sm uppercase tracking-wide', error && 'border-rose-300 focus-visible:border-rose-400')}
          maxLength={20}
          autoComplete="off"
        />
        <Button type="button" variant="outline" size="sm" className="h-10 flex-shrink-0" onClick={apply}>
          Pakai
        </Button>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 text-[11px] text-rose-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <p className="mt-1.5 text-[10px] text-surface-400">
        Coba: <span className="font-mono text-surface-600">TEKNIZI10</span> ·{' '}
        <span className="font-mono text-surface-600">HEMAT5K</span> ·{' '}
        <span className="font-mono text-surface-600">NEWUSER</span>
      </p>
    </div>
  )
}
