'use client'

import { motion } from 'framer-motion'
import type { ProductCategory } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  conditionGradeLabel,
  fmtBoolDisplay,
  replacedPartsDisplay,
  scoreTone,
  showThreeUtoolsBenchmark,
  type ProductBenchmarkDisplay,
} from '@/lib/product-benchmark-display'
import {
  AlertCircle,
  CheckCircle,
  Shield,
  Smartphone,
  Sparkles,
  XCircle,
  Zap,
} from '@/lib/icons'

const ease = [0.22, 1, 0.36, 1] as const

const toneStyles = {
  good: {
    ring: 'stroke-primary-600',
    bar: 'bg-primary-600',
  },
  warn: {
    ring: 'stroke-primary-400',
    bar: 'bg-primary-400',
  },
  bad: {
    ring: 'stroke-surface-400',
    bar: 'bg-surface-400',
  },
  neutral: {
    ring: 'stroke-surface-300',
    bar: 'bg-surface-300',
  },
} as const

const iconBoxClass =
  'grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-primary-700 shadow-soft-xs'

function ScoreRing({
  value,
  label,
  sublabel,
}: {
  value: number | null
  label: string
  sublabel?: string | null
}) {
  const tone = scoreTone(value)
  const styles = toneStyles[tone]
  const pct = value ?? 0
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 96 96" aria-hidden>
          <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-100" />
          {value != null && (
            <motion.circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={styles.ring}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              whileInView={{ strokeDashoffset: offset }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black tabular-nums text-black">
            {value != null ? `${value}%` : '—'}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-surface-500">
            {label}
          </span>
        </div>
      </div>
      {sublabel && (
        <p className="mt-2 max-w-[11rem] text-[11px] leading-relaxed text-surface-500">{sublabel}</p>
      )}
    </div>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Zap
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-surface-50 p-3">
      <div className={iconBoxClass}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-surface-500">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-black">{value}</p>
      </div>
    </div>
  )
}

function ProgressMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: keyof typeof toneStyles
}) {
  const styles = toneStyles[tone]
  return (
    <div className="rounded-2xl bg-surface-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-surface-500">{label}</p>
        <span className="text-sm font-bold tabular-nums text-black">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-100">
        <motion.div
          className={cn('h-full rounded-full', styles.bar)}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease }}
        />
      </div>
    </div>
  )
}

type Props = {
  category: ProductCategory
  benchmark: ProductBenchmarkDisplay
  className?: string
}

/** Panel metrik benchmark — tanpa card wrapper (untuk embed di detail card). */
export function ProductBenchmarkPanel({ category, benchmark, className }: Props) {
  const gradeLabel = conditionGradeLabel(benchmark.conditionGrade)
  const showApple = showThreeUtoolsBenchmark(category)
  const replacedLabel =
    benchmark.isAllOriginal === true
      ? 'Semua original'
      : benchmark.replacedParts.length > 0
        ? replacedPartsDisplay(benchmark.replacedParts)
        : benchmark.isAllOriginal === false
          ? 'Ada part non-original'
          : null

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-surface-500">
          Kondisi & hardware
        </p>
        <div className="flex flex-wrap gap-2">
          {benchmark.verified3uTools && (
            <Badge variant="primary" className="text-[10px]">
              <Shield className="h-3 w-3" />
              3uTools Verified
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,200px)_1fr] lg:gap-6">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-50 p-4">
          <ScoreRing
            value={benchmark.conditionPercent}
            label="Kondisi fisik"
            sublabel={gradeLabel ?? undefined}
          />
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {benchmark.batteryHealth != null && (
              <ProgressMetric
                label="Battery health"
                value={benchmark.batteryHealth}
                tone={scoreTone(benchmark.batteryHealth, 85, 70)}
              />
            )}
            {benchmark.batteryCycle != null && (
              <MetricTile
                icon={Zap}
                label="Cycle count"
                value={benchmark.batteryCycle.toLocaleString('id-ID')}
              />
            )}
            {benchmark.isAllOriginal != null && (
              <MetricTile
                icon={benchmark.isAllOriginal ? CheckCircle : AlertCircle}
                label="Part original"
                value={fmtBoolDisplay(benchmark.isAllOriginal, 'Semua original', 'Ada yang diganti') ?? '—'}
              />
            )}
            {showApple && benchmark.trueToneActive != null && (
              <MetricTile
                icon={benchmark.trueToneActive ? Sparkles : XCircle}
                label="True Tone"
                value={fmtBoolDisplay(benchmark.trueToneActive, 'Aktif', 'Tidak aktif') ?? '—'}
              />
            )}
            {showApple && benchmark.faceIdWorks != null && (
              <MetricTile
                icon={benchmark.faceIdWorks ? Smartphone : XCircle}
                label="Face / Touch ID"
                value={fmtBoolDisplay(benchmark.faceIdWorks, 'Normal', 'Bermasalah') ?? '—'}
              />
            )}
            {replacedLabel && benchmark.isAllOriginal !== true && (
              <MetricTile icon={AlertCircle} label="Part diganti" value={replacedLabel} />
            )}
          </div>

          {benchmark.minusNotes?.trim() && (
            <div className="rounded-2xl bg-surface-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-surface-500">
                Catatan minus
              </p>
              <p className="mt-1 text-sm leading-relaxed text-black">{benchmark.minusNotes.trim()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
