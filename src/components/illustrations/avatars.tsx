'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Cute, illustrated avatars (not real photos).
 * Three personas — User (customer), Teknisi (technician), Admin (mediator).
 * All built with inline SVG so they animate cleanly with framer-motion and
 * scale crisply at any size.
 */

type AvatarProps = {
  size?: number
  className?: string
  /** Show online dot (small green pulse). */
  online?: boolean
  /** Optional micro-animation: subtle head bob. */
  animated?: boolean
}

/* ---------------------------------------------------------------------------
   USER AVATAR — friendly, casual hoodie, soft emerald palette
   ------------------------------------------------------------------------- */
export function UserAvatar({ size = 56, className, online, animated = true }: AvatarProps) {
  return (
    <motion.div
      className={cn('relative inline-block', className)}
      style={{ width: size, height: size }}
      animate={animated ? { y: [0, -2, 0] } : undefined}
      transition={
        animated ? { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } : undefined
      }
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden>
        <defs>
          <linearGradient id="user-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="user-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde7c4" />
            <stop offset="100%" stopColor="#f5d3a3" />
          </linearGradient>
          <linearGradient id="user-hood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle cx="32" cy="32" r="32" fill="url(#user-bg)" />

        {/* Soft inner glow */}
        <circle cx="22" cy="22" r="14" fill="rgba(255,255,255,0.18)" />

        {/* Hoodie body */}
        <path
          d="M 12 56 Q 12 42 32 42 Q 52 42 52 56 Z"
          fill="url(#user-hood)"
        />

        {/* Head */}
        <circle cx="32" cy="30" r="11" fill="url(#user-skin)" />

        {/* Hair tuft */}
        <path
          d="M 22 26 Q 24 17 32 17 Q 40 17 42 26 Q 38 22 32 22 Q 26 22 22 26 Z"
          fill="#1f2937"
        />

        {/* Hood collar */}
        <path
          d="M 18 42 Q 32 50 46 42 L 48 46 Q 32 54 16 46 Z"
          fill="#065f46"
        />

        {/* Eyes (animated blink) */}
        <motion.g
          animate={animated ? { scaleY: [1, 1, 0.1, 1, 1] } : undefined}
          transition={
            animated
              ? { duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1], ease: 'linear' }
              : undefined
          }
          style={{ transformOrigin: '32px 31px' }}
        >
          <circle cx="28" cy="31" r="1.4" fill="#1f2937" />
          <circle cx="36" cy="31" r="1.4" fill="#1f2937" />
        </motion.g>

        {/* Smile */}
        <path
          d="M 28 35 Q 32 38 36 35"
          stroke="#1f2937"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheek blush */}
        <circle cx="25" cy="34" r="1.4" fill="#f9a8d4" opacity="0.45" />
        <circle cx="39" cy="34" r="1.4" fill="#f9a8d4" opacity="0.45" />
      </svg>

      {online && <OnlineDot accent="primary" />}
    </motion.div>
  )
}

/* ---------------------------------------------------------------------------
   TEKNISI AVATAR — technician with cap & headset, cyan palette
   ------------------------------------------------------------------------- */
export function TeknisiAvatar({
  size = 56,
  className,
  online,
  animated = true,
}: AvatarProps) {
  return (
    <motion.div
      className={cn('relative inline-block', className)}
      style={{ width: size, height: size }}
      animate={animated ? { y: [0, -2, 0] } : undefined}
      transition={
        animated
          ? { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }
          : undefined
      }
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden>
        <defs>
          <linearGradient id="tek-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0e7490" />
          </linearGradient>
          <linearGradient id="tek-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde7c4" />
            <stop offset="100%" stopColor="#f5d3a3" />
          </linearGradient>
          <linearGradient id="tek-shirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <linearGradient id="tek-cap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e7490" />
            <stop offset="100%" stopColor="#155e75" />
          </linearGradient>
        </defs>

        <circle cx="32" cy="32" r="32" fill="url(#tek-bg)" />
        <circle cx="22" cy="22" r="14" fill="rgba(255,255,255,0.18)" />

        {/* Shirt body */}
        <path
          d="M 12 56 Q 12 42 32 42 Q 52 42 52 56 Z"
          fill="url(#tek-shirt)"
        />

        {/* Logo on shirt */}
        <rect x="28" y="48" width="8" height="2" rx="1" fill="rgba(255,255,255,0.6)" />

        {/* Head */}
        <circle cx="32" cy="30" r="11" fill="url(#tek-skin)" />

        {/* Cap base */}
        <path
          d="M 21 26 Q 21 19 32 19 Q 43 19 43 26 L 41 26 Q 41 22 32 22 Q 23 22 23 26 Z"
          fill="url(#tek-cap)"
        />
        {/* Cap visor */}
        <path
          d="M 19 26 Q 32 28 45 26 L 45 28 Q 32 30 19 28 Z"
          fill="#0c4a5e"
        />
        {/* Cap badge */}
        <circle cx="32" cy="22" r="1.6" fill="#fbbf24" />

        {/* Headset over the ear */}
        <path
          d="M 21 28 Q 21 23 24 23"
          stroke="#1f2937"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="19" y="28" width="3" height="4" rx="1.5" fill="#1f2937" />
        {/* Mic */}
        <path
          d="M 21 33 Q 24 36 28 36"
          stroke="#1f2937"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="29" cy="36" r="1" fill="#1f2937" />

        {/* Eyes — focused (slightly squinted) */}
        <motion.g
          animate={animated ? { scaleY: [1, 1, 0.1, 1, 1] } : undefined}
          transition={
            animated
              ? { duration: 4.2, repeat: Infinity, times: [0, 0.42, 0.47, 0.52, 1], ease: 'linear' }
              : undefined
          }
          style={{ transformOrigin: '32px 31px' }}
        >
          <circle cx="28" cy="31" r="1.4" fill="#1f2937" />
          <circle cx="36" cy="31" r="1.4" fill="#1f2937" />
        </motion.g>

        {/* Confident smirk */}
        <path
          d="M 28 35 L 36 35"
          stroke="#1f2937"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {online && <OnlineDot accent="cyan" />}
    </motion.div>
  )
}

/* ---------------------------------------------------------------------------
   ADMIN AVATAR — formal mediator with shield insignia, amber palette
   ------------------------------------------------------------------------- */
export function AdminAvatar({
  size = 56,
  className,
  online,
  animated = true,
}: AvatarProps) {
  return (
    <motion.div
      className={cn('relative inline-block', className)}
      style={{ width: size, height: size }}
      animate={animated ? { y: [0, -2, 0] } : undefined}
      transition={
        animated
          ? { duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }
          : undefined
      }
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden>
        <defs>
          <linearGradient id="adm-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="adm-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde7c4" />
            <stop offset="100%" stopColor="#f5d3a3" />
          </linearGradient>
          <linearGradient id="adm-suit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
        </defs>

        <circle cx="32" cy="32" r="32" fill="url(#adm-bg)" />
        <circle cx="22" cy="22" r="14" fill="rgba(255,255,255,0.22)" />

        {/* Suit body */}
        <path
          d="M 12 56 Q 12 42 32 42 Q 52 42 52 56 Z"
          fill="url(#adm-suit)"
        />

        {/* Suit lapels */}
        <path d="M 32 42 L 22 56 L 26 56 L 32 46 Z" fill="#111827" />
        <path d="M 32 42 L 42 56 L 38 56 L 32 46 Z" fill="#111827" />

        {/* White collar / shirt visible */}
        <path d="M 28 42 L 32 48 L 36 42 Z" fill="#ffffff" />

        {/* Tie */}
        <path d="M 30 44 L 32 56 L 34 44 Z" fill="#dc2626" />

        {/* Head */}
        <circle cx="32" cy="30" r="11" fill="url(#adm-skin)" />

        {/* Slick neat hair */}
        <path
          d="M 22 26 Q 24 18 32 18 Q 40 18 42 26 Q 38 23 32 23 Q 26 23 22 26 Z"
          fill="#1f2937"
        />
        {/* Side part */}
        <path d="M 32 18 L 34 23" stroke="#374151" strokeWidth="0.7" />

        {/* Shield insignia on suit */}
        <g>
          <path
            d="M 20 50 L 23 49 L 23 53 Q 23 55 21.5 56 Q 20 55 20 53 Z"
            fill="#fbbf24"
            stroke="#92400e"
            strokeWidth="0.4"
          />
          <path
            d="M 20.5 52 L 21.4 53 L 22.5 51"
            stroke="#92400e"
            strokeWidth="0.7"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Glasses */}
        <circle cx="28" cy="31" r="2.6" fill="none" stroke="#1f2937" strokeWidth="1.2" />
        <circle cx="36" cy="31" r="2.6" fill="none" stroke="#1f2937" strokeWidth="1.2" />
        <line x1="30.6" y1="31" x2="33.4" y2="31" stroke="#1f2937" strokeWidth="1.2" />

        {/* Eyes inside glasses (animated blink) */}
        <motion.g
          animate={animated ? { scaleY: [1, 1, 0.1, 1, 1] } : undefined}
          transition={
            animated
              ? { duration: 4.6, repeat: Infinity, times: [0, 0.48, 0.53, 0.58, 1], ease: 'linear' }
              : undefined
          }
          style={{ transformOrigin: '32px 31px' }}
        >
          <circle cx="28" cy="31" r="0.9" fill="#1f2937" />
          <circle cx="36" cy="31" r="0.9" fill="#1f2937" />
        </motion.g>

        {/* Calm smile */}
        <path
          d="M 28 35.5 Q 32 37.5 36 35.5"
          stroke="#1f2937"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {online && <OnlineDot accent="amber" />}
    </motion.div>
  )
}

/* ---------------------------------------------------------------------------
   ONLINE DOT — pulse indicator, color-tagged per role
   ------------------------------------------------------------------------- */
function OnlineDot({ accent }: { accent: 'primary' | 'cyan' | 'amber' }) {
  const cls =
    accent === 'primary'
      ? 'bg-primary-500'
      : accent === 'cyan'
        ? 'bg-cyan-500'
        : 'bg-amber-500'
  return (
    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-70',
          cls,
        )}
      />
      <span
        className={cn(
          'relative inline-flex h-3 w-3 rounded-full border-2 border-white',
          cls,
        )}
      />
    </span>
  )
}
