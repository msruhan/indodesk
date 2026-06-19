'use client'

import { useEffect, useRef } from 'react'
import { animate, useInView, useMotionValue } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  /** Delay before count-up starts (seconds) */
  delay?: number
  /** Animation duration in seconds */
  duration?: number
  /** Locale used for Number formatting */
  locale?: string
  /** Suffix appended (e.g. '+', '%') */
  suffix?: string
  /** Prefix prepended (e.g. 'Rp ') */
  prefix?: string
  /** Decimals to render */
  decimals?: number
  className?: string
}

/**
 * Animated count-up that respects reduced-motion and only fires when in view.
 * Uses framer-motion's animate() — runs on the main thread once, then idle.
 */
export function AnimatedNumber({
  value,
  delay = 0,
  duration = 1.6,
  locale = 'id-ID',
  suffix = '',
  prefix = '',
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motion = useMotionValue(0)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  useEffect(() => {
    if (!isInView) return
    let controls: ReturnType<typeof animate> | undefined
    const timer = window.setTimeout(() => {
      controls = animate(motion, value, {
        duration,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v) => {
          if (!ref.current) return
          ref.current.textContent = `${prefix}${v.toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}${suffix}`
        },
      })
    }, delay * 1000)
    return () => {
      window.clearTimeout(timer)
      controls?.stop()
    }
  }, [isInView, motion, value, delay, duration, locale, suffix, prefix, decimals])

  return (
    <span ref={ref} className={className}>
      {`${prefix}0${suffix}`}
    </span>
  )
}
