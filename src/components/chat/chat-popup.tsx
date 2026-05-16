'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { cn } from '@/lib/utils'
import { useChat } from '@/contexts/chat-context'
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  X,
  MessageCircle,
  Minimize2,
} from '@/lib/icons'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  text: string
  sender: 'me' | 'other'
  timestamp: string
  read: boolean
}

interface Chat {
  id: string
  name: string
  avatar: string
  lastMessage: string
  timestamp: string
  unread: number
  isOnline?: boolean
  messages: Message[]
}

const chats: Chat[] = [
  {
    id: '1',
    name: 'Ahmad Hidayat',
    avatar: '/api/placeholder/40/40',
    lastMessage: 'Baik, saya akan bantu unlock iPhone Anda',
    timestamp: '10:30',
    unread: 2,
    isOnline: true,
    messages: [
      { id: '1', text: 'Halo, saya butuh bantuan unlock iPhone 13', sender: 'me', timestamp: '10:25', read: true },
      { id: '2', text: 'Halo, baik. Saya bisa bantu. Bisa kirim IMEI-nya?', sender: 'other', timestamp: '10:26', read: true },
      { id: '3', text: 'IMEI: 123456789012345', sender: 'me', timestamp: '10:27', read: true },
      { id: '4', text: 'Baik, saya akan bantu unlock iPhone Anda', sender: 'other', timestamp: '10:30', read: false },
    ],
  },
  {
    id: '2',
    name: 'HandPhone Center Jakarta',
    avatar: '/api/placeholder/40/40',
    lastMessage: 'Barang sudah ready untuk diambil',
    timestamp: 'Kemarin',
    unread: 0,
    isOnline: true,
    messages: [
      { id: '1', text: 'Kapan barang bisa diambil?', sender: 'me', timestamp: '14:00', read: true },
      { id: '2', text: 'Barang sudah ready untuk diambil', sender: 'other', timestamp: '14:30', read: true },
    ],
  },
  {
    id: '3',
    name: 'Admin Support',
    avatar: '/api/placeholder/40/40',
    lastMessage: 'Pertanyaan Anda sudah kami proses',
    timestamp: '2 hari lalu',
    unread: 0,
    isOnline: false,
    messages: [
      { id: '1', text: 'Saya ada pertanyaan tentang rekber', sender: 'me', timestamp: '09:00', read: true },
      { id: '2', text: 'Pertanyaan Anda sudah kami proses', sender: 'other', timestamp: '10:00', read: true },
    ],
  },
]

export function ChatPopup() {
  const { isOpen, closeChat } = useChat()
  const [selectedChat, setSelectedChat] = useState<string>('1')
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)

  const currentChat = chats.find((c) => c.id === selectedChat)
  const totalUnread = chats.reduce((sum, chat) => sum + chat.unread, 0)

  const handleSendMessage = () => {
    if (!message.trim()) return
    setMessage('')
  }

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'fixed right-4 z-50 sm:right-5 lg:bottom-6',
            // Mobile: sit above the floating dock + iOS safe area
            'bottom-mobile-fab',
            isMinimized ? 'w-72' : 'w-[min(92vw,640px)]',
          )}
        >
          <div
            className={cn(
              'flex flex-col overflow-hidden rounded-3xl border border-surface-200/70 bg-white/95 shadow-soft-2xl backdrop-blur-xl',
              isMinimized ? 'h-auto' : 'h-[min(78vh,720px)]',
            )}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-surface-200/60 bg-gradient-to-br from-primary-600 via-primary-600 to-accent-600 px-4 py-3 text-white">
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-60" />
              <div className="relative flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">Inbox</span>
                {totalUnread > 0 && (
                  <Badge variant="glass" className="h-5 px-2 text-[10px] !text-primary-700">
                    {totalUnread} baru
                  </Badge>
                )}
              </div>
              <div className="relative flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                  aria-label="Minimize chat"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={closeChat}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex flex-1 overflow-hidden">
                {/* Chat list */}
                <div className="flex w-[240px] flex-shrink-0 flex-col border-r border-surface-200/60 bg-white/90">
                  <div className="border-b border-surface-200/60 p-3">
                    <div className="relative">
                      <Search
                        className={cn(searchInputIconClass, 'left-3 h-3.5 w-3.5')}
                        strokeWidth={2}
                        aria-hidden
                      />
                      <Input
                        type="text"
                        placeholder="Cari percakapan…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 rounded-xl pl-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat.id)}
                        className={cn(
                          'group/conv relative w-full border-b border-surface-200/40 p-3 text-left transition-colors',
                          selectedChat === chat.id
                            ? 'bg-primary-50/60'
                            : 'hover:bg-surface-50',
                        )}
                      >
                        {selectedChat === chat.id && (
                          <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b from-primary-500 to-accent-500" />
                        )}
                        <div className="flex items-start gap-2.5">
                          <div className="relative flex-shrink-0">
                            <img
                              src={`https://i.pravatar.cc/150?img=${parseInt(chat.id)}`}
                              alt={chat.name}
                              className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-soft-xs"
                            />
                            {chat.isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 inline-block h-3 w-3 rounded-full border-2 border-white bg-primary-500 shadow-soft-xs" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-semibold text-ink">
                                {chat.name}
                              </span>
                              <span className="flex-shrink-0 text-[10px] text-surface-500">
                                {chat.timestamp}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs text-surface-500">
                                {chat.lastMessage}
                              </p>
                              {chat.unread > 0 && (
                                <Badge
                                  variant="primary"
                                  className="h-4 min-w-4 justify-center px-1.5 text-[10px]"
                                >
                                  {chat.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat window */}
                <div className="flex flex-1 flex-col">
                  {currentChat ? (
                    <>
                      {/* Conversation header */}
                      <div className="flex items-center justify-between border-b border-surface-200/60 bg-white/90 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <img
                              src={`https://i.pravatar.cc/150?img=${parseInt(currentChat.id)}`}
                              alt={currentChat.name}
                              className="h-9 w-9 rounded-full object-cover"
                            />
                            {currentChat.isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary-500" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-ink">
                              {currentChat.name}
                            </div>
                            {currentChat.isOnline ? (
                              <div className="flex items-center gap-1 text-[11px] text-primary-700">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-500" />
                                Online sekarang
                              </div>
                            ) : (
                              <div className="text-[11px] text-surface-500">Offline</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-ink">
                            <Phone className="h-3.5 w-3.5" />
                          </button>
                          <button className="inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-ink">
                            <Video className="h-3.5 w-3.5" />
                          </button>
                          <button className="inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-ink">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-surface-50/40 to-white px-4 py-4">
                        {currentChat.messages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className={cn(
                              'flex',
                              msg.sender === 'me' ? 'justify-end' : 'justify-start',
                            )}
                          >
                            <div
                              className={cn(
                                'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-soft-xs',
                                msg.sender === 'me'
                                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                                  : 'border border-surface-200/70 bg-white text-ink',
                              )}
                            >
                              <p className="leading-relaxed">{msg.text}</p>
                              <div
                                className={cn(
                                  'mt-1 flex items-center justify-end gap-1 text-[10px]',
                                  msg.sender === 'me'
                                    ? 'text-white/70'
                                    : 'text-surface-400',
                                )}
                              >
                                <span>{msg.timestamp}</span>
                                {msg.sender === 'me' &&
                                  (msg.read ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  ))}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Input */}
                      <div className="border-t border-surface-200/60 bg-white/90 px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="Ketik pesan…"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="h-10 flex-1 rounded-full"
                          />
                          <Button
                            onClick={handleSendMessage}
                            variant="primary"
                            size="icon"
                            className="h-10 w-10 flex-shrink-0"
                            aria-label="Send message"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <div className="text-center">
                        <MessageCircle className="mx-auto mb-2 h-10 w-10 text-surface-300" />
                        <p className="text-sm text-surface-500">Pilih chat untuk mulai</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
