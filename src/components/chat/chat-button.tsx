'use client'

import { useChat } from '@/contexts/chat-context'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from '@/lib/icons'
import { motion } from 'framer-motion'

export function ChatButton() {
  const { isOpen, toggleChat, messenger } = useChat()
  const totalUnread = messenger.totalUnread

  if (isOpen) return null

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleChat}
      className={[
        'group/chat fixed bottom-6 right-5 z-50 hidden h-14 w-14 items-center justify-center rounded-full',
        'bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 text-white shadow-glow-primary',
        'transition-shadow duration-450 hover:shadow-glow-primary-lg',
        'lg:inline-flex',
      ].join(' ')}
      aria-label="Buka chat"
    >
      {/* Pulse ring */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-primary-400/40 opacity-0 transition-opacity duration-450 group-hover/chat:opacity-100"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/30"
      />
      <MessageCircle weight="fill" className="relative h-[22px] w-[22px]" />

      {totalUnread > 0 && (
        <Badge
          variant="danger"
          className="pointer-events-none absolute -top-1.5 -right-1.5 h-5 w-5 justify-center border-2 border-white p-0 text-[10px] font-bold"
        >
          {totalUnread > 99 ? '99+' : totalUnread}
        </Badge>
      )}
    </motion.button>
  )
}
