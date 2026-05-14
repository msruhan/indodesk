'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MagneticProps extends Omit<HTMLMotionProps<'span'>, 'ref'> {
  children: ReactNode
  /** Pull strength (px) */
  strength?: number
}

/**
 * Magnetic interaction — element subtly follows the cursor.
 * Uses framer-motion springs for a premium, organic feel.
 */
export function Magnetic({ children, strength = 14, className, ...rest }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

  const handleMove = (event: React.MouseEvent<HTMLSpanElement>) => {
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const offsetX = event.clientX - rect.left - rect.width / 2
    const offsetY = event.clientY - rect.top - rect.height / 2
    x.set((offsetX / rect.width) * strength * 2)
    y.set((offsetY / rect.height) * strength * 2)
  }

  const handleLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.span
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy }}
      className={cn('inline-flex', className)}
      {...rest}
    >
      {children}
    </motion.span>
  )
}
