'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ProfileCompletionItem, ProfileCompletionStatus } from '@/lib/profile-completion'
import {
  AlertCircle,
  Briefcase,
  ChevronRight,
  FileText,
  MapPin,
  Phone,
  Sparkles,
} from '@/lib/icons'
import type { IconType } from '@/lib/icons-types'

const ITEM_ICONS: Record<string, IconType> = {
  phone: Phone,
  location: MapPin,
  address: MapPin,
  description: FileText,
  specialty: Sparkles,
  portfolio: Briefcase,
}

type ProfileCompletionBannerProps = {
  status: ProfileCompletionStatus
  title?: string
  description?: string
  className?: string
}

function CompletionItemRow({ item }: { item: ProfileCompletionItem }) {
  const Icon = ITEM_ICONS[item.id] ?? AlertCircle

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-100/80 bg-white/70 px-3 py-2.5 sm:px-4">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{item.label}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-surface-500 sm:text-xs">{item.hint}</p>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 shrink-0 border-amber-200/80 bg-white px-2.5 text-xs text-amber-900 hover:bg-amber-50 sm:px-3"
      >
        <Link href={item.href}>
          Lengkapi
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  )
}

export function ProfileCompletionBanner({
  status,
  title = 'Profil belum lengkap',
  description = 'Lengkapi data penting agar profil Anda lebih profesional dan mudah ditemukan klien.',
  className,
}: ProfileCompletionBannerProps) {
  if (status.isComplete || status.items.length === 0) return null

  const primaryHref = status.items[0]?.href ?? '/teknisi/settings'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 p-4 shadow-soft-xs sm:p-5',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/30 blur-3xl"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200/70">
            <AlertCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-amber-950 sm:text-base">{title}</h2>
              <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-amber-800 ring-1 ring-amber-200/70 sm:text-[11px]">
                {status.progressPercent}% lengkap
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/75 sm:text-sm">{description}</p>
          </div>
        </div>

        {status.items.length > 1 ? (
          <Button asChild variant="primary" size="sm" className="h-9 shrink-0 sm:mt-0.5">
            <Link href={primaryHref}>Lengkapi semua</Link>
          </Button>
        ) : null}
      </div>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-amber-100/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
          style={{ width: `${status.progressPercent}%` }}
        />
      </div>

      <ul className="relative mt-3 space-y-2">
        {status.items.map((item) => (
          <li key={item.id}>
            <CompletionItemRow item={item} />
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
