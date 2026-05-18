'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Filter,
  TrendingDown,
  TrendingUp,
} from '@/lib/icons'
import type { IconType } from '@/lib/icons-types'

type Trend = {
  value: string
  label?: string
  direction?: 'up' | 'down' | 'neutral'
}

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: ReactNode
  title: string
  description?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 inline-flex items-center rounded-full border border-primary-200/70 bg-primary-50/70 px-3 py-1 text-[11px] font-semibold text-primary-700">
            {eyebrow}
          </div>
        )}
        <h1 className="text-balance text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-surface-500">
            {description}
          </p>
        )}
        {meta && <div className="mt-3">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function MiniSparkline({
  data,
  tone = 'primary',
}: {
  data: number[]
  tone?: 'primary' | 'warning' | 'danger' | 'neutral'
}) {
  const width = 96
  const height = 32
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = Math.max(max - min, 1)
  const points = data.map((value, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * width
    const y = height - ((value - min) / range) * (height - 6) - 3
    return [x, y] as const
  })
  const path = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  const lineColor = {
    primary: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    neutral: '#525252',
  }[tone]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
      <path d={path} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={`${path} L ${width} ${height} L 0 ${height} Z`}
        fill={lineColor}
        opacity="0.08"
      />
    </svg>
  )
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  sparkline,
  footnote,
  tone = 'primary',
  compact = false,
  dense = false,
}: {
  title: string
  value: string
  icon: IconType
  trend?: Trend
  sparkline?: number[]
  footnote?: ReactNode
  tone?: 'primary' | 'warning' | 'danger' | 'neutral'
  /** Compact mode — smaller padding, text, and icon for tight grids */
  compact?: boolean
  /** Extra-tight layout for 3-column mobile rows */
  dense?: boolean
}) {
  const isDown = trend?.direction === 'down'
  const isNeutral = trend?.direction === 'neutral'
  const trendTone = isNeutral ? 'text-surface-500' : isDown ? 'text-red-600' : 'text-primary-700'
  const iconTone = {
    primary: 'bg-primary-50 text-primary-700 ring-primary-200/70',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200/70',
    danger: 'bg-red-50 text-red-700 ring-red-200/70',
    neutral: 'bg-surface-100 text-surface-600 ring-surface-200/80',
  }[tone]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="group h-full overflow-hidden hover:-translate-y-0.5 transition-[transform,box-shadow]">
        <CardContent className={cn(dense ? 'p-2 sm:p-3.5' : compact ? 'p-3 sm:p-3.5' : 'p-5')}>
          <div
            className={cn(
              'flex items-start justify-between',
              dense ? 'mb-1 gap-1.5' : compact ? 'mb-1.5 gap-3' : 'mb-4 gap-3',
            )}
          >
            <div className="min-w-0">
              <p
                className={cn(
                  'font-medium text-surface-600',
                  dense ? 'text-[10px] leading-tight' : compact ? 'text-[11px]' : 'text-sm',
                )}
              >
                {title}
              </p>
              <div
                className={cn(
                  'font-semibold leading-none tracking-tightest text-ink',
                  dense ? 'mt-0.5 text-base sm:text-xl' : compact ? 'mt-1 text-xl' : 'mt-2 text-[28px]',
                )}
              >
                {value}
              </div>
            </div>
            <span
              className={cn(
                'inline-flex flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                iconTone,
                dense ? 'h-6 w-6 sm:h-7 sm:w-7' : compact ? 'h-7 w-7' : 'h-9 w-9',
              )}
            >
              <Icon
                className={cn(
                  dense ? 'h-3 w-3 sm:h-3.5 sm:w-3.5' : compact ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5',
                )}
              />
            </span>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              {trend && (
                <div className={cn('flex items-center gap-1 font-semibold', trendTone, compact ? 'text-[10px]' : 'text-xs')}>
                  {isDown ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                  <span>{trend.value}</span>
                  {trend.label && <span className="font-medium text-surface-500">{trend.label}</span>}
                </div>
              )}
              {footnote && (
                <div
                  className={cn(
                    'line-clamp-2 text-surface-500',
                    dense
                      ? 'mt-0.5 text-[9px] leading-tight sm:text-[10px]'
                      : compact
                        ? 'mt-0.5 text-[10px]'
                        : 'mt-1 text-xs',
                  )}
                >
                  {footnote}
                </div>
              )}
            </div>
            {sparkline && !compact && !dense && <MiniSparkline data={sparkline} tone={tone} />}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function InsightCard({
  title,
  description,
  icon: Icon,
  tone = 'primary',
}: {
  title: string
  description: string
  icon: IconType
  tone?: 'primary' | 'warning' | 'danger' | 'neutral'
}) {
  const toneClass = {
    primary: 'bg-primary-50 text-primary-700 ring-primary-200/70',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200/70',
    danger: 'bg-red-50 text-red-700 ring-red-200/70',
    neutral: 'bg-surface-100 text-surface-600 ring-surface-200/80',
  }[tone]

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-surface-200/70 bg-white/70 p-3 shadow-soft-xs">
      <span className={cn('inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', toneClass)}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-surface-500">{description}</p>
      </div>
    </div>
  )
}

export function DataToolbar({
  searchValue,
  onSearchChange,
  placeholder = 'Cari data...',
  filters,
  actions,
  resultLabel,
}: {
  searchValue?: string
  onSearchChange?: (value: string) => void
  placeholder?: string
  filters?: ReactNode
  actions?: ReactNode
  resultLabel?: ReactNode
}) {
  return (
    <Card tone="flat" className="bg-white/80">
      <CardContent className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
              className="min-w-0 flex-1"
              iconLeftClass="left-3.5"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={placeholder}
              inputClassName="rounded-full bg-white pl-10"
            />
            <Button type="button" variant="outline" size="sm">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            {filters}
          </div>
          <div className="flex items-center justify-between gap-3">
            {resultLabel && <div className="text-xs font-medium text-surface-500">{resultLabel}</div>}
            {actions}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: IconType
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/70 px-6 py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-surface-400 shadow-soft-xs">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-surface-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-surface-200/70 pb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  )
}

export function StatusBadge({
  status,
}: {
  status:
    | 'completed'
    | 'pending'
    | 'in-progress'
    | 'failed'
    | 'approved'
    | 'rejected'
    | 'dispute'
    | 'draft'
}) {
  const config = {
    completed: { label: 'Completed', variant: 'success' as const },
    pending: { label: 'Pending', variant: 'warning' as const },
    'in-progress': { label: 'In Progress', variant: 'info' as const },
    failed: { label: 'Failed', variant: 'danger' as const },
    approved: { label: 'Approved', variant: 'success' as const },
    rejected: { label: 'Rejected', variant: 'danger' as const },
    dispute: { label: 'Dispute', variant: 'danger' as const },
    draft: { label: 'Draft', variant: 'outline' as const },
  }[status]

  return <Badge variant={config.variant}>{config.label}</Badge>
}
