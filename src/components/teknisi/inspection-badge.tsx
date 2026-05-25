'use client'

import { motion } from 'framer-motion'
import { ShieldCheck } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

type InspectionBadgeSize = 'xs' | 'sm' | 'md'

type InspectionBadgeProps = {
  size?: InspectionBadgeSize
  className?: string
  /**
   * When true the badge animates a subtle shimmer + pulse on the icon.
   * Disable on lists with many cards to avoid motion overload.
   */
  animated?: boolean
  label?: string
}

const sizeConfig: Record<
  InspectionBadgeSize,
  { padding: string; text: string; icon: string; gap: string; ring: string }
> = {
  xs: {
    padding: 'px-1.5 py-0.5',
    text: 'text-[9px]',
    icon: 'h-2.5 w-2.5',
    gap: 'gap-1',
    ring: 'ring-1',
  },
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-[10px]',
    icon: 'h-3 w-3',
    gap: 'gap-1',
    ring: 'ring-1',
  },
  md: {
    padding: 'px-2.5 py-1',
    text: 'text-[11px]',
    icon: 'h-3.5 w-3.5',
    gap: 'gap-1.5',
    ring: 'ring-1',
  },
}

/**
 * "Bisa Inspeksi" badge — signals that a teknisi offers the inspection service.
 *
 * Visual language:
 *   - Teal/cyan gradient pill (distinct from amber Top, primary Verified).
 *   - Shield icon to convey trust and protection.
 *   - Animated shimmer sweep + icon pulse for an elevated, modern feel.
 */
export function InspectionBadge({
  size = 'sm',
  className,
  animated = true,
  label = 'Bisa Inspeksi',
}: InspectionBadgeProps) {
  const cfg = sizeConfig[size]

  return (
    <motion.span
      initial={animated ? { opacity: 0, scale: 0.85 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={cn(
        'relative inline-flex items-center overflow-hidden whitespace-nowrap rounded-full',
        'bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50',
        'text-teal-700 ring-inset ring-teal-200/80',
        'shadow-[0_1px_3px_-1px_rgba(13,148,136,0.25)]',
        'font-bold tracking-tight',
        cfg.padding,
        cfg.text,
        cfg.gap,
        cfg.ring,
        className,
      )}
    >
      {/* Shimmer sweep */}
      {animated && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -inset-x-2 bg-gradient-to-r from-transparent via-white/70 to-transparent"
          initial={{ x: '-120%' }}
          animate={{ x: '220%' }}
          transition={{
            duration: 2.4,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 3.6,
          }}
        />
      )}

      {/* Icon with subtle pulse */}
      <motion.span
        aria-hidden
        className="relative inline-flex"
        animate={
          animated
            ? { scale: [1, 1.08, 1], rotate: [0, -4, 0] }
            : undefined
        }
        transition={
          animated
            ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      >
        <ShieldCheck className={cn(cfg.icon, 'text-teal-600')} weight="fill" />
      </motion.span>

      <span className="relative">{label}</span>
    </motion.span>
  )
}
