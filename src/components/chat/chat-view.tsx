'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchInput } from '@/components/ui/search-input'
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Paperclip,
  Image,
  Smile,
  X,
  MessageCircle,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { peerAvatarUrl } from '@/lib/chat-serializer'
import { useChatMessenger } from '@/hooks/use-chat-messenger'

const QUICK_EMOJIS = ['😀', '😂', '😊', '🙏', '👍', '❤️', '🔥', '✅', '📱', '💬', '🎉', '👋']

function ChatComposer({
  message,
  onMessageChange,
  onSend,
  disabled,
}: {
  message: string
  onMessageChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const appendEmoji = (emoji: string) => {
    onMessageChange(message + emoji)
    setShowEmojiPicker(false)
  }

  const handleSend = () => {
    if (!message.trim() || disabled) return
    onSend()
    setShowEmojiPicker(false)
  }

  return (
    <div className="shrink-0 border-t border-surface-200 bg-white p-3 sm:p-4">
      {showEmojiPicker && (
        <div
          className="mb-2 grid grid-cols-6 gap-1 rounded-xl border border-surface-200 bg-surface-50 p-2 sm:grid-cols-8"
          role="listbox"
          aria-label="Pilih emoji"
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-white"
              onClick={() => appendEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'h-10 w-10 p-0',
            showEmojiPicker ? 'bg-primary-50 text-primary-700' : 'text-surface-600',
          )}
          onClick={() => setShowEmojiPicker((v) => !v)}
          aria-label="Emoji"
        >
          <Smile className="h-[18px] w-[18px]" strokeWidth={2} />
        </Button>

        <Input
          type="text"
          placeholder="Ketik pesan..."
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={disabled}
          className="min-h-10 flex-1"
        />

        <Button
          type="button"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="h-10 w-10 shrink-0 bg-gradient-to-r from-primary-600 to-accent-500 p-0"
          aria-label="Kirim pesan"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ChatView({ className }: { className?: string }) {
  const searchParams = useSearchParams()
  const peerId = searchParams.get('peer')

  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    isAuthenticated,
    isLoading,
    loadingMessages,
    sending,
    error,
    conversations,
    messages,
    selectedId,
    currentConversation,
    setSelectedId,
    sendMessage,
  } = useChatMessenger({ peerId, poll: true, pollMessages: true, autoConnectPeer: true })

  const showConversation = !!selectedId

  const filteredChats = conversations.filter((chat) =>
    chat.peerName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    if (!selectedId || loadingMessages) return
    const frame = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [selectedId, loadingMessages, messages])

  const handleSendMessage = async () => {
    const text = message.trim()
    if (!text) return
    const ok = await sendMessage(text)
    if (ok) {
      setMessage('')
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-surface-200 bg-white p-8 text-center">
        <p className="text-sm text-surface-500">Silakan login untuk menggunakan chat.</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-col lg:grid lg:grid-cols-3 lg:gap-0',
        'h-[calc(100dvh-11rem)] max-lg:h-[calc(100dvh-10rem)]',
        className,
      )}
    >
      {error && (
        <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 lg:col-span-3">{error}</p>
      )}

      <Card
        className={cn(
          'flex min-h-0 flex-col overflow-hidden lg:col-span-1 lg:rounded-r-none lg:border-r-0',
          showConversation && 'hidden lg:flex',
        )}
      >
        <div className="shrink-0 border-b border-surface-200/60 p-3 sm:p-4">
          <h2 className="mb-3 text-base font-semibold tracking-tight text-ink">Pesan</h2>
          <SearchInput
            placeholder="Cari chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="p-4 text-center text-xs text-surface-500">Memuat percakapan...</p>
          ) : filteredChats.length === 0 ? (
            <p className="p-4 text-center text-xs text-surface-500">Belum ada percakapan.</p>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => setSelectedId(chat.id)}
                className={cn(
                  'group/chat relative w-full border-b border-surface-200/40 px-3 py-3 text-left transition-colors hover:bg-surface-50 sm:px-4',
                  selectedId === chat.id && 'bg-primary-50/60',
                )}
              >
                {selectedId === chat.id && (
                  <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b from-primary-500 to-accent-500" />
                )}
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={peerAvatarUrl(chat.peerId, chat.peerImage)}
                      alt={chat.peerName}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-soft-xs"
                    />
                    {chat.peerIsOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-primary-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-ink">{chat.peerName}</span>
                      <span className="flex-shrink-0 text-[10px] text-surface-500">{chat.timestamp}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-[12px] text-surface-500">{chat.lastMessage ?? '—'}</p>
                      {chat.unread > 0 && (
                        <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card
        className={cn(
          'flex min-h-0 flex-col overflow-hidden lg:col-span-2 lg:rounded-l-none',
          !showConversation && 'hidden lg:flex',
          showConversation && 'absolute inset-0 z-10 lg:relative lg:inset-auto',
        )}
      >
        {currentConversation ? (
          <>
            <div className="flex shrink-0 items-center gap-2 border-b border-surface-200/60 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-600 hover:bg-surface-100 lg:hidden"
                aria-label="Kembali"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex flex-1 items-center gap-2.5">
                <div className="relative">
                  <img
                    src={peerAvatarUrl(currentConversation.peerId, currentConversation.peerImage)}
                    alt={currentConversation.peerName}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  {currentConversation.peerIsOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{currentConversation.peerName}</p>
                  {currentConversation.peerIsOnline && (
                    <p className="text-[10px] text-primary-700">Online</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-40">
                <Phone className="h-4 w-4 text-surface-400" />
                <Video className="h-4 w-4 text-surface-400" />
                <MoreVertical className="h-4 w-4 text-surface-400" />
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-surface-50/30 to-white p-3 sm:p-4">
              {loadingMessages ? (
                <p className="text-center text-xs text-surface-500">Memuat pesan...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-xs text-surface-500">Mulai percakapan dengan mengirim pesan.</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex', msg.isMine ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] shadow-soft-xs sm:max-w-[70%]',
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
                          (msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <ChatComposer
              message={message}
              onMessageChange={setMessage}
              onSend={() => void handleSendMessage()}
              disabled={sending}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageCircle className="mx-auto mb-2 h-10 w-10 text-surface-300" />
              <p className="text-sm font-medium text-ink">Pilih percakapan</p>
              <p className="mt-1 text-xs text-surface-500">Klik chat di sebelah kiri untuk mulai</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
