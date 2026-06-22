'use client'

import { Edit } from '@/lib/icons'
import { cn } from '@/lib/utils'

type OwnerEditButtonProps = {
  label: string
  onClick: () => void
  className?: string
}

export function OwnerEditButton({ label, onClick, className }: OwnerEditButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-surface-200/80 bg-white/90 text-surface-500 shadow-soft-xs transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700',
        className,
      )}
    >
      <Edit className="h-4 w-4" />
    </button>
  )
}
