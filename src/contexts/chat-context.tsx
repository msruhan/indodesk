'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useChatMessenger, type UseChatMessengerReturn } from '@/hooks/use-chat-messenger'

type ChatContextType = {
  isOpen: boolean
  peerId: string | null
  openChat: () => void
  openChatWithPeer: (peerId: string) => void
  closeChat: () => void
  toggleChat: () => void
  messenger: UseChatMessengerReturn
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [peerId, setPeerId] = useState<string | null>(null)

  const messenger = useChatMessenger({
    peerId,
    poll: true,
    pollMessages: isOpen,
    autoConnectPeer: true,
  })

  const openChat = useCallback(() => {
    setIsOpen(true)
  }, [])

  const openChatWithPeer = useCallback((id: string) => {
    setPeerId(id)
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
    setPeerId(null)
  }, [])

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) setPeerId(null)
      return !prev
    })
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      peerId,
      openChat,
      openChatWithPeer,
      closeChat,
      toggleChat,
      messenger,
    }),
    [isOpen, peerId, openChat, openChatWithPeer, closeChat, toggleChat, messenger],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
