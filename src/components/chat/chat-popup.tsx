'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { cn } from '@/lib/utils'
import { useChat } from '@/contexts/chat-context'
import { peerAvatarUrl } from '@/lib/chat-serializer'
import {
  Search,
  Send,
  Check,
  CheckCheck,
  X,
  MessageCircle,
  Minimize2,
} from '@/lib/icons'
import { motion, AnimatePresence } from 'framer-motion'

export function ChatPopup() {
  const { isOpen, peerId, closeChat, messenger } = useChat()
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    isAuthenticated,
    isLoading,
    isConnectingPeer,
    loadingMessages,
    sending,
    error,
    conversations,
    messages,
    selectedId,
    currentConversation,
    totalUnread,
    setSelectedId,
    sendMessage,
  } = messenger

  const filteredChats = conversations.filter((chat) =>
    chat.peerName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    if (!isOpen || !selectedId || loadingMessages || isMinimized) return
    const frame = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [isOpen, selectedId, loadingMessages, isMinimized, messages])

  const handleSendMessage = async () => {
    const text = message.trim()
    if (!text) return
    const ok = await sendMessage(text)
    if (ok) {
      setMessage('')
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }

  if (!isAuthenticated) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'fixed bottom-24 right-5 z-50',
            isMinimized ? 'w-72' : 'w-[min(92vw,640px)]',
          )}
        >
          <div
            className={cn(
              'flex flex-col overflow-hidden rounded-3xl border border-surface-200/70 bg-white/95 shadow-soft-2xl backdrop-blur-xl',
              isMinimized ? 'h-auto' : 'h-[min(78vh,720px)]',
            )}
          >
            <div className="relative flex items-center justify-between border-b border-surface-200/60 bg-gradient-to-br from-primary-600 via-primary-600 to-accent-600 px-4 py-3 text-white">
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
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/15"
                  aria-label="Minimize"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={closeChat}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/15"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex flex-1 overflow-hidden">
                <div className="flex w-[240px] flex-shrink-0 flex-col border-r border-surface-200/60 bg-white/90">
                  <div className="border-b border-surface-200/60 p-3">
                    <div className="relative">
                      <Search className={cn(searchInputIconClass, 'left-3 h-3.5 w-3.5')} aria-hidden />
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
                    {isLoading ? (
                      <p className="p-3 text-center text-xs text-surface-500">Memuat...</p>
                    ) : filteredChats.length === 0 ? (
                      <p className="p-3 text-center text-xs text-surface-500">Belum ada chat</p>
                    ) : (
                      filteredChats.map((chat) => (
                        <button
                          key={chat.id}
                          type="button"
                          onClick={() => setSelectedId(chat.id)}
                          className={cn(
                            'relative w-full border-b border-surface-200/40 p-3 text-left hover:bg-surface-50',
                            selectedId === chat.id && 'bg-primary-50/60',
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="relative flex-shrink-0">
                              <img
                                src={peerAvatarUrl(chat.peerId, chat.peerImage)}
                                alt={chat.peerName}
                                className="h-9 w-9 rounded-full object-cover"
                              />
                              {chat.peerIsOnline && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-primary-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-0.5 flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-semibold text-ink">{chat.peerName}</span>
                                <span className="text-[10px] text-surface-500">{chat.timestamp}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-xs text-surface-500">
                                  {chat.lastMessage ?? '—'}
                                </p>
                                {chat.unread > 0 && (
                                  <Badge variant="primary" className="h-4 min-w-4 justify-center px-1 text-[10px]">
                                    {chat.unread}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col">
                  {isConnectingPeer || (peerId && !currentConversation && isLoading) ? (
                    <div className="flex flex-1 items-center justify-center">
                      <div className="text-center">
                        <MessageCircle className="mx-auto mb-2 h-10 w-10 animate-pulse text-primary-400" />
                        <p className="text-sm font-medium text-ink">Menghubungkan chat...</p>
                      </div>
                    </div>
                  ) : currentConversation ? (
                    <>
                      <div className="flex items-center justify-between border-b border-surface-200/60 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={peerAvatarUrl(
                              currentConversation.peerId,
                              currentConversation.peerImage,
                            )}
                            alt={currentConversation.peerName}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-sm font-semibold text-ink">
                              {currentConversation.peerName}
                            </div>
                            {currentConversation.peerIsOnline ? (
                              <div className="text-[11px] text-primary-700">Online sekarang</div>
                            ) : (
                              <div className="text-[11px] text-surface-500">Offline</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-surface-50/40 to-white px-4 py-4">
                        {loadingMessages ? (
                          <p className="text-center text-xs text-surface-500">Memuat pesan...</p>
                        ) : (
                          messages.map((msg) => (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn('flex', msg.isMine ? 'justify-end' : 'justify-start')}
                            >
                              <div
                                className={cn(
                                  'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-soft-xs',
                                  msg.isMine
                                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                                    : 'border border-surface-200/70 bg-white text-ink',
                                )}
                              >
                                <p className="leading-relaxed">{msg.body}</p>
                                <div
                                  className={cn(
                                    'mt-1 flex items-center justify-end gap-1 text-[10px]',
                                    msg.isMine ? 'text-white/70' : 'text-surface-400',
                                  )}
                                >
                                  <span>{msg.timestamp}</span>
                                  {msg.isMine &&
                                    (msg.read ? (
                                      <CheckCheck className="h-3 w-3" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    ))}
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                        <motion.div ref={messagesEndRef} />
                      </div>

                      <div className="border-t border-surface-200/60 px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="Ketik pesan…"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && void handleSendMessage()}
                            disabled={sending}
                            className="h-10 flex-1 rounded-full"
                          />
                          <Button
                            onClick={() => void handleSendMessage()}
                            variant="primary"
                            size="icon"
                            className="h-10 w-10 flex-shrink-0"
                            disabled={sending || !message.trim()}
                            aria-label="Kirim"
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
                        <p className="text-sm text-surface-500">
                          {error ?? 'Pilih chat untuk mulai'}
                        </p>
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
