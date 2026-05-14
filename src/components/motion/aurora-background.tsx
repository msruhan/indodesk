'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AuroraBackgroundProps {
  className?: string
  /** Make the aurora more vivid for hero sections */
  intensity?: 'subtle' | 'normal' | 'vivid'
  /** Disable motion for sections where stillness reads more premium */
  static?: boolean
}

/**
 * Premium light-mode aurora — three soft floating blobs (emerald, cyan, violet)
 * over a delicate grid. GPU-friendly: only `transform` & `opacity` animate.
 */
export function AuroraBackground({
  className,
  intensity = 'normal',
  static: isStatic = false,
}: AuroraBackgroundProps) {
  const opacity = intensity === 'subtle' ? 0.45 : intensity === 'vivid' ? 0.95 : 0.7

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      {/* Soft grid (mask-faded for depth) */}
      <div className="absolute inset-0 grid-fade opacity-60" />

      {/* Emerald blob */}
      <motion.div
        className="aurora-blob aurora-blob-emerald"
        style={{ width: 520, height: 520, top: '-12%', left: '-6%', opacity }}
        animate={
          isStatic
            ? undefined
            : {
                x: [0, 30, -10, 0],
                y: [0, -20, 10, 0],
                scale: [1, 1.06, 0.98, 1],
              }
        }
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Cyan blob */}
      <motion.div
        className="aurora-blob aurora-blob-cyan"
        style={{ width: 460, height: 460, top: '10%', right: '-8%', opacity: opacity * 0.85 }}
        animate={
          isStatic
            ? undefined
            : {
                x: [0, -24, 12, 0],
                y: [0, 18, -10, 0],
                scale: [1, 1.04, 0.96, 1],
              }
        }
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />

      {/* Violet blob */}
      <motion.div
        className="aurora-blob aurora-blob-violet"
        style={{ width: 380, height: 380, bottom: '-10%', left: '32%', opacity: opacity * 0.75 }}
        animate={
          isStatic
            ? undefined
            : {
                x: [0, 18, -14, 0],
                y: [0, -14, 8, 0],
                scale: [1, 1.05, 0.97, 1],
              }
        }
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </div>
  )
}
