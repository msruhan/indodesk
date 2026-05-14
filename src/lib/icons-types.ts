import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

/**
 * Shared icon type compatible with the Phosphor icons we re-export from `@/lib/icons`.
 * The mapped icons use `withPremiumWeight` which preserves the underlying Phosphor
 * `IconProps` (including the typed `weight` enum), so we alias to `PhosphorIcon`.
 */
export type IconType = PhosphorIcon

export {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
} from '@/lib/icons'
