'use client'

import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Sparkle,
  Check,
  VideoCamera,
  MapPin,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { InspectionBadge } from './inspection-badge'

type InspectionServiceToggleProps = {
  enabled: boolean
  onChange: (enabled: boolean) => void
  priceOnline: number | null
  priceOffline: number | null
  onPriceOnlineChange: (value: number | null) => void
  onPriceOfflineChange: (value: number | null) => void
  disabled?: boolean
}

const PERKS = [
  'Tampil dengan badge "Bisa Inspeksi" di profil & pencarian',
  'Tarif inspeksi muncul di section "Bandingkan & Pilih"',
  'Bisa terima request inspeksi online & offline',
]

const formatRupiah = (value: number | null) =>
  value == null
    ? ''
    : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)

const parseRupiah = (raw: string): number | null => {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null
  const n = Number(digits)
  return Number.isFinite(n) ? n : null
}

function PriceInput({
  icon,
  label,
  hint,
  helper,
  value,
  onChange,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  hint: string
  helper: string
  value: number | null
  onChange: (next: number | null) => void
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        'group/price relative overflow-hidden rounded-xl border bg-white/80 p-3 transition-colors',
        value != null
          ? 'border-teal-200 shadow-[0_4px_14px_-8px_rgba(13,148,136,0.35)]'
          : 'border-surface-200 hover:border-teal-200',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
            value != null
              ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-sm'
              : 'bg-surface-100 text-surface-500',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12.5px] font-bold tracking-tight text-ink">{label}</p>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-surface-400">
              {hint}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-surface-500">{helper}</p>

          <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 transition-colors focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
            <span className="text-[11px] font-bold text-surface-500">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              disabled={disabled}
              value={formatRupiah(value)}
              onChange={(e) => onChange(parseRupiah(e.target.value))}
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold tabular-nums text-ink outline-none placeholder:text-surface-300"
            />
            {value != null && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-[10px] font-bold text-surface-400 hover:text-rose-600"
                aria-label={`Hapus tarif ${label.toLowerCase()}`}
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Modern toggle for the inspection service.
 * When enabled, exposes two price inputs (online + offline).
 * Either price can be null — interpreted as "not offered".
 */
export function InspectionServiceToggle({
  enabled,
  onChange,
  priceOnline,
  priceOffline,
  onPriceOnlineChange,
  onPriceOfflineChange,
  disabled = false,
}: InspectionServiceToggleProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500',
        enabled
          ? 'border-teal-200/80 bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/60 shadow-[0_8px_30px_-12px_rgba(13,148,136,0.25)]'
          : 'border-surface-200/70 bg-white shadow-soft-xs',
      )}
    >
      {/* Decorative glow when enabled */}
      {enabled && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-teal-300 to-cyan-400 opacity-25 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.32, 0.18] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-gradient-to-tr from-cyan-300 to-teal-400 opacity-20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.28, 0.12] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </>
      )}

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <motion.div
          initial={false}
          animate={{
            scale: enabled ? 1 : 0.96,
            rotate: enabled ? 0 : -4,
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-sm transition-colors duration-500',
            enabled
              ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-[0_6px_18px_-6px_rgba(13,148,136,0.5)]'
              : 'bg-surface-100 text-surface-400',
          )}
        >
          <ShieldCheck className="h-6 w-6" weight="fill" />
        </motion.div>

        {/* Header text + toggle */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[15px] font-bold tracking-tight text-ink">
              Layanan Inspeksi
            </h4>
            {enabled && <InspectionBadge size="xs" animated={false} />}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-surface-600">
            Aktifkan jika Anda bisa membantu user mengecek kondisi HP/Laptop
            sebelum membeli — secara online (video call) atau offline (datang ke
            lokasi).
          </p>
        </div>

        {/* Modern animated switch */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Aktifkan layanan inspeksi"
          disabled={disabled}
          onClick={() => onChange(!enabled)}
          className={cn(
            'relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ease-out-expo',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70 focus-visible:ring-offset-2',
            enabled
              ? 'bg-gradient-to-r from-teal-500 to-cyan-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.15),0_4px_12px_-4px_rgba(13,148,136,0.5)]'
              : 'bg-surface-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 600, damping: 32 }}
            className={cn(
              'pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md',
              enabled ? 'translate-x-6' : 'translate-x-1',
            )}
          >
            <motion.span
              key={enabled ? 'on' : 'off'}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="inline-flex"
            >
              {enabled ? (
                <Check className="h-3 w-3 text-teal-600" weight="bold" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-surface-400" />
              )}
            </motion.span>
          </motion.span>
        </button>
      </div>

      {/* Expanded content — appears when enabled */}
      <motion.div
        initial={false}
        animate={{
          height: enabled ? 'auto' : 0,
          opacity: enabled ? 1 : 0,
          marginTop: enabled ? 16 : 0,
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden"
      >
        <div className="space-y-4">
          {/* Price inputs */}
          <div className="rounded-xl border border-teal-100/80 bg-white/70 p-3 backdrop-blur-sm">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">
                <Sparkle className="h-3 w-3" weight="fill" />
                Tarif Inspeksi
              </div>
              <span className="text-[10px] text-surface-500">
                Kosongkan jika tidak ditawarkan
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <PriceInput
                icon={<VideoCamera className="h-4 w-4" weight="fill" />}
                label="Inspeksi Online"
                hint="Via video call"
                helper="Teknisi memandu pengecekan via video. Cepat & fleksibel."
                value={priceOnline}
                onChange={onPriceOnlineChange}
                disabled={disabled}
              />
              <PriceInput
                icon={<MapPin className="h-4 w-4" weight="fill" />}
                label="Inspeksi Offline"
                hint="On-site"
                helper="Teknisi datang ke lokasi. Pengecekan fisik & laporan tertulis."
                value={priceOffline}
                onChange={onPriceOfflineChange}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Perks list */}
          <div className="space-y-2 rounded-xl border border-teal-100/80 bg-white/70 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">
              <Sparkle className="h-3 w-3" weight="fill" />
              Manfaat aktif
            </div>
            <ul className="space-y-1.5">
              {PERKS.map((perk, i) => (
                <motion.li
                  key={perk}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: enabled ? 1 : 0, x: enabled ? 0 : -8 }}
                  transition={{ duration: 0.3, delay: enabled ? i * 0.06 : 0 }}
                  className="flex items-start gap-2 text-[12px] leading-relaxed text-surface-700"
                >
                  <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                    <Check className="h-2.5 w-2.5 text-teal-700" weight="bold" />
                  </span>
                  <span>{perk}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
