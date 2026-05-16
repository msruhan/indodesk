'use client'

import { useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from '@/lib/icons'
import { cn } from '@/lib/utils'

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

type Attachment = { name: string; kind: 'file' | 'image' }

const QUICK_EMOJIS = ['😀', '😂', '😊', '🙏', '👍', '❤️', '🔥', '✅', '📱', '💬', '🎉', '👋']

const chatsSeed: Chat[] = [
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

function ChatComposer({
  message,
  onMessageChange,
  onSend,
}: {
  message: string
  onMessageChange: (value: string) => void
  onSend: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const appendEmoji = (emoji: string) => {
    onMessageChange(message + emoji)
    setShowEmojiPicker(false)
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>, kind: Attachment['kind']) => {
    const file = e.target.files?.[0]
    if (file) setAttachment({ name: file.name, kind })
    e.target.value = ''
  }

  const handleSend = () => {
    if (!message.trim() && !attachment) return
    onSend()
    setAttachment(null)
    setShowEmojiPicker(false)
  }

  return (
    <div className="shrink-0 border-t border-surface-200 bg-white p-3 sm:p-4">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFilePick(e, 'file')}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFilePick(e, 'image')}
      />

      {attachment && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm">
          {attachment.kind === 'image' ? (
            <Image className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
          ) : (
            <Paperclip className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
          )}
          <span className="min-w-0 flex-1 truncate text-ink">{attachment.name}</span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="rounded-md p-1 text-surface-500 hover:bg-surface-200 hover:text-ink"
            aria-label="Hapus lampiran"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
              role="option"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-colors hover:bg-white"
              onClick={() => appendEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5 sm:gap-2">
        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 text-surface-600 hover:text-ink"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Lampirkan file"
            title="Lampirkan file"
          >
            <Paperclip className="h-[18px] w-[18px]" strokeWidth={2} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 text-surface-600 hover:text-ink"
            onClick={() => imageInputRef.current?.click()}
            aria-label="Lampirkan foto"
            title="Lampirkan foto"
          >
            <Image className="h-[18px] w-[18px]" strokeWidth={2} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-10 w-10 p-0',
              showEmojiPicker ? 'bg-primary-50 text-primary-700' : 'text-surface-600 hover:text-ink',
            )}
            onClick={() => setShowEmojiPicker((v) => !v)}
            aria-label="Emoji"
            aria-expanded={showEmojiPicker}
            title="Emoji"
          >
            <Smile className="h-[18px] w-[18px]" strokeWidth={2} />
          </Button>
        </div>

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
          className="min-h-10 flex-1"
        />

        <Button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() && !attachment}
          className="h-10 w-10 shrink-0 bg-gradient-to-r from-primary-600 to-accent-500 p-0 sm:h-10 sm:w-10"
          aria-label="Kirim pesan"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ChatView({ className }: { className?: string }) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const currentChat = selectedChat ? chatsSeed.find((c) => c.id === selectedChat) : null

  const handleSendMessage = () => {
    if (!message.trim()) return
    setMessage('')
  }

  const filteredChats = chatsSeed.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Mobile: show conversation full-screen when a chat is selected
  const showConversation = !!selectedChat

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-col lg:grid lg:grid-cols-3 lg:gap-0',
        'h-[calc(100dvh-11rem)] max-lg:h-[calc(100dvh-10rem)]',
        className,
      )}
    >
      {/* Chat list — hidden on mobile when conversation is open */}
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
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => setSelectedChat(chat.id)}
              className={cn(
                'group/chat relative w-full border-b border-surface-200/40 px-3 py-3 text-left transition-colors hover:bg-surface-50 sm:px-4',
                selectedChat === chat.id && 'bg-primary-50/60',
              )}
            >
              {selectedChat === chat.id && (
                <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b from-primary-500 to-accent-500" />
              )}
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={`https://i.pravatar.cc/150?img=${parseInt(chat.id) + 10}`}
                    alt={chat.name}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-soft-xs"
                  />
                  {chat.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-primary-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-ink">{chat.name}</span>
                    <span className="flex-shrink-0 text-[10px] text-surface-500">{chat.timestamp}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="truncate text-[12px] text-surface-500">{chat.lastMessage}</p>
                    {chat.unread > 0 && (
                      <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Conversation panel — full-screen on mobile */}
      <Card
        className={cn(
          'flex min-h-0 flex-col overflow-hidden lg:col-span-2 lg:rounded-l-none',
          !showConversation && 'hidden lg:flex',
          showConversation && 'absolute inset-0 z-10 lg:relative lg:inset-auto',
        )}
      >
        {currentChat ? (
          <>
            {/* Header with back button on mobile */}
            <div className="flex shrink-0 items-center gap-2 border-b border-surface-200/60 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
              <button
                type="button"
                onClick={() => setSelectedChat(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-600 transition-colors hover:bg-surface-100 hover:text-ink lg:hidden"
                aria-label="Kembali ke daftar chat"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex flex-1 items-center gap-2.5">
                <div className="relative">
                  <img
                    src={`https://i.pravatar.cc/150?img=${parseInt(currentChat.id) + 10}`}
                    alt={currentChat.name}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  {currentChat.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{currentChat.name}</p>
                  {currentChat.isOnline && (
                    <p className="text-[10px] text-primary-700">Online</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-ink" aria-label="Telepon">
                  <Phone className="h-4 w-4" />
                </button>
                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-ink" aria-label="Video">
                  <Video className="h-4 w-4" />
                </button>
                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-ink" aria-label="Menu">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-surface-50/30 to-white p-3 sm:p-4">
              {currentChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn('flex', msg.sender === 'me' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] shadow-soft-xs sm:max-w-[70%]',
                      msg.sender === 'me'
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                        : 'border border-surface-200/70 bg-white text-ink',
                    )}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <div
                      className={cn(
                        'mt-1 flex items-center justify-end gap-1 text-[10px]',
                        msg.sender === 'me' ? 'text-white/70' : 'text-surface-400',
                      )}
                    >
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'me' &&
                        (msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Composer */}
            <ChatComposer
              message={message}
              onMessageChange={setMessage}
              onSend={handleSendMessage}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
                <Send className="h-6 w-6 text-surface-400" />
              </div>
              <p className="text-sm font-medium text-ink">Pilih percakapan</p>
              <p className="mt-1 text-xs text-surface-500">Klik chat di sebelah kiri untuk mulai</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
