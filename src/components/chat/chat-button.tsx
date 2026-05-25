'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@/contexts/chat-context'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from '@/lib/icons'
import { motion } from 'framer-motion'

type FabMotionState = 'idle' | 'pulse' | 'burst'

function fabAnimate(state: FabMotionState) {
  if (state === 'burst') {
    return {
      scale: [1, 1.08, 1, 1.04, 1],
      opacity: 1,
      y: [0, -14, 0, -9, 0, -5, 0],
      transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as const },
    }
  }
  if (state === 'pulse') {
    return {
      scale: 1,
      opacity: 1,
      y: [0, -7, 0],
      transition: {
        duration: 1.1,
        repeat: Infinity,
        repeatDelay: 0.85,
        ease: 'easeInOut' as const,
      },
    }
  }
  return { scale: 1, opacity: 1, y: 0 }
}

export function ChatButton() {
  const { isOpen, toggleChat, messenger } = useChat()
  const totalUnread = messenger.totalUnread
  const prevUnreadRef = useRef(0)
  const [motionState, setMotionState] = useState<FabMotionState>('idle')
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const prev = prevUnreadRef.current
    prevUnreadRef.current = totalUnread

    if (totalUnread > prev) {
      setMotionState('burst')
      const timer = window.setTimeout(() => {
        setMotionState(totalUnread > 0 ? 'pulse' : 'idle')
      }, 900)
      return () => window.clearTimeout(timer)
    }

    setMotionState(totalUnread > 0 ? 'pulse' : 'idle')
  }, [totalUnread])

  if (isOpen) return null

  const hasUnread = totalUnread > 0

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0, y: 0 }}
      animate={
        hasEntered
          ? fabAnimate(motionState)
          : { scale: 1, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 24 } }
      }
      onAnimationComplete={() => setHasEntered(true)}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleChat}
      className={[
        'group/chat fixed bottom-6 right-5 z-50 hidden h-14 w-14 items-center justify-center rounded-full',
        'bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 text-white shadow-glow-primary',
        'transition-shadow duration-450 hover:shadow-glow-primary-lg',
        hasUnread && 'shadow-glow-primary-lg',
        'lg:inline-flex',
      ].join(' ')}
      aria-label={hasUnread ? `Buka chat, ${totalUnread} pesan belum dibaca` : 'Buka chat'}
    >
      <span
        aria-hidden
        className={[
          'pointer-events-none absolute inset-0 rounded-full bg-primary-400/40 transition-opacity duration-450',
          hasUnread ? 'animate-ping opacity-60' : 'opacity-0 group-hover/chat:opacity-100',
        ].join(' ')}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/30"
      />
      <MessageCircle weight="fill" className="relative h-[22px] w-[22px]" />

      {hasUnread && (
        <motion.span
          className="pointer-events-none absolute -top-1.5 -right-1.5"
          animate={
            motionState === 'burst'
              ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] }
              : { scale: [1, 1.08, 1] }
          }
          transition={
            motionState === 'burst'
              ? { duration: 0.85, ease: 'easeOut' }
              : { duration: 1.1, repeat: Infinity, repeatDelay: 0.85 }
          }
        >
          <Badge
            variant="danger"
            className="h-5 w-5 justify-center border-2 border-white p-0 text-[10px] font-bold"
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </Badge>
        </motion.span>
      )}
    </motion.button>
  )
}
