'use client'

import { useChat } from '@/contexts/chat-context'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export function ChatButton() {
  const { isOpen, toggleChat, openChat } = useChat()

  // Mock unread count
  const totalUnread = 2

  if (isOpen) return null

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleChat}
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
      aria-label="Open chat"
    >
      <MessageCircle className="w-6 h-6" />
      {totalUnread > 0 && (
        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center p-0 border-2 border-white">
          {totalUnread}
        </Badge>
      )}
    </motion.button>
  )
}

