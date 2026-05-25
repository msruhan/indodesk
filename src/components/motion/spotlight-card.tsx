'use client'

import { useRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Tint the spotlight halo */
  tone?: 'primary' | 'accent' | 'neutral'
  /** Disable mouse tracking on touch / low-end devices */
  disableSpotlight?: boolean
}

/**
 * Card with a soft cursor-following halo and a subtle 3D tilt — Linear/Stripe inspired.
 * Pure CSS variables + RAF, no framer overhead.
 */
export function SpotlightCard({
  children,
  className,
  tone = 'primary',
  disableSpotlight,
  onMouseMove,
  onMouseLeave,
  ...rest
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  const tintMap = {
    primary: 'rgba(16, 185, 129, 0.18)',
    accent: 'rgba(8, 145, 178, 0.18)',
    neutral: 'rgba(15, 23, 42, 0.12)',
  } as const

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove?.(event)
    if (disableSpotlight) return
    const node = ref.current
    if (!node) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const rect = node.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const tiltX = ((y / rect.height) - 0.5) * -3
    const tiltY = ((x / rect.width) - 0.5) * 3

    rafRef.current = requestAnimationFrame(() => {
      node.style.setProperty('--spot-x', `${x}px`)
      node.style.setProperty('--spot-y', `${y}px`)
      node.style.setProperty('--tilt-x', `${tiltX}deg`)
      node.style.setProperty('--tilt-y', `${tiltY}deg`)
    })
  }

  const handleLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    onMouseLeave?.(event)
    const node = ref.current
    if (!node) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    node.style.setProperty('--tilt-x', '0deg')
    node.style.setProperty('--tilt-y', '0deg')
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn(
        'group/spot relative isolate overflow-hidden rounded-3xl border border-surface-200/70 bg-white/80 p-6 shadow-soft-sm backdrop-blur-md transition-all duration-450 ease-out-expo',
        'hover:border-surface-200 hover:shadow-soft-lg',
        '[transform-style:preserve-3d] will-change-transform',
        className,
      )}
      style={{
        transform:
          'perspective(1000px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))',
      }}
      {...rest}
    >
      {/* Spotlight halo */}
      {!disableSpotlight && (
        <div
          className="pointer-events-none absolute inset-0 -z-0 rounded-[inherit] opacity-0 transition-opacity duration-450 ease-out-expo group-hover/spot:opacity-100"
          style={{
            background: `radial-gradient(360px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${tintMap[tone]}, transparent 60%)`,
          }}
        />
      )}

      {/* Content — flex column so h-full + mt-auto layouts work in grids */}
      <div className="relative flex h-full min-h-0 flex-col">{children}</div>
    </div>
  )
}
