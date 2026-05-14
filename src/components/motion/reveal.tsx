'use client'

import { motion, type HTMLMotionProps, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

type RevealProps = HTMLMotionProps<'div'> & {
  delay?: number
  /** Disable the blur stage on weaker devices */
  noBlur?: boolean
}

export const easeOutExpo: [number, number, number, number] = [0.22, 1, 0.36, 1]
export const easeOutQuart: [number, number, number, number] = [0.25, 1, 0.5, 1]
export const easeInOutQuart: [number, number, number, number] = [0.76, 0, 0.24, 1]

export const viewportReveal: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: easeOutExpo },
  },
}

export const viewportRevealNoBlur: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: easeOutExpo },
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.085,
      delayChildren: 0.05,
    },
  },
}

export const staggerContainerFast: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
}

export function Reveal({ className, delay = 0, noBlur, ...props }: RevealProps) {
  return (
    <motion.div
      variants={noBlur ? viewportRevealNoBlur : viewportReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay }}
      className={cn(className)}
      {...props}
    />
  )
}
