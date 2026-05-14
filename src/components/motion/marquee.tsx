'use client'

import { Children, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MarqueeProps {
  children: ReactNode
  /** Animation duration in seconds (lower = faster) */
  duration?: number
  /** Gap between items */
  gap?: number
  /** Reverse direction */
  reverse?: boolean
  /** Pause on hover (desktop) */
  pauseOnHover?: boolean
  className?: string
}

/**
 * Premium horizontal marquee using CSS keyframes — zero JS frame work,
 * ideal for logo strips, social proof, or running tickers.
 */
export function Marquee({
  children,
  duration = 40,
  gap = 48,
  reverse,
  pauseOnHover = true,
  className,
}: MarqueeProps) {
  const items = Children.toArray(children)

  return (
    <div className={cn('relative overflow-hidden marquee-mask', className)}>
      <div
        className={cn(
          'flex w-max items-center will-change-transform',
          pauseOnHover && 'hover:[animation-play-state:paused]',
        )}
        style={{
          gap: `${gap}px`,
          animation: `marquee ${duration}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        {[...items, ...items].map((child, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} className="shrink-0">
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
