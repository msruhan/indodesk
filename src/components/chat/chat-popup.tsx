'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Minimize2
} from 'lucide-react'
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

export function ChatPopup() {
  const { isOpen, closeChat, toggleChat } = useChat()
  const [selectedChat, setSelectedChat] = useState<string>('1')
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)

  // Mock data
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
      ]
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
      ]
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
      ]
    },
  ]

  const currentChat = chats.find(c => c.id === selectedChat)
  const totalUnread = chats.reduce((sum, chat) => sum + chat.unread, 0)

  const handleSendMessage = () => {
    if (!message.trim()) return
    // In production, send to API
    setMessage('')
  }

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AnimatePresence>
      {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 400, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed bottom-6 right-6 z-50 ${
              isMinimized ? 'w-80' : 'w-[600px]'
            }`}
          >
            <Card className="shadow-2xl border-2 border-surface-200 flex flex-col h-[700px]">
              {/* Header */}
              <div className="p-4 border-b border-surface-200 bg-gradient-to-r from-primary-600 to-accent-500 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold">Chat</span>
                  {totalUnread > 0 && (
                    <Badge className="bg-white text-primary-600 text-xs">
                      {totalUnread} baru
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeChat}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <div className="flex-1 flex overflow-hidden">
                  {/* Chat List */}
                  <div className="w-[240px] border-r border-surface-200 flex flex-col">
                    <div className="p-3 border-b border-surface-200">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <Input
                          type="text"
                          placeholder="Cari..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {filteredChats.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => setSelectedChat(chat.id)}
                          className={`w-full p-3 border-b border-surface-200 hover:bg-surface-50 transition-colors text-left ${
                            selectedChat === chat.id ? 'bg-primary-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="relative flex-shrink-0">
                              <img
                                src={`https://i.pravatar.cc/150?img=${parseInt(chat.id)}`}
                                alt={chat.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              {chat.isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm truncate">{chat.name}</span>
                                <span className="text-xs text-surface-500">{chat.timestamp}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-surface-400 truncate">{chat.lastMessage}</p>
                                {chat.unread > 0 && (
                                  <Badge className="bg-primary-600 text-white text-xs w-5 h-5 flex items-center justify-center p-0">
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

                  {/* Chat Window */}
                  <div className="flex-1 flex flex-col">
                    {currentChat ? (
                      <>
                        {/* Chat Header */}
                        <div className="p-3 border-b border-surface-200 flex items-center justify-between bg-surface-50">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <img
                                src={`https://i.pravatar.cc/150?img=${parseInt(currentChat.id)}`}
                                alt={currentChat.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              {currentChat.isOnline && (
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{currentChat.name}</div>
                              {currentChat.isOnline && (
                                <div className="text-xs text-green-600">Online</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Phone className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Video className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface-50">
                          {currentChat.messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                                  msg.sender === 'me'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-white border border-surface-200'
                                }`}
                              >
                                <p>{msg.text}</p>
                                <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                                  msg.sender === 'me' ? 'text-white/70' : 'text-surface-500'
                                }`}>
                                  <span>{msg.timestamp}</span>
                                  {msg.sender === 'me' && (
                                    msg.read ? (
                                      <CheckCheck className="w-3 h-3" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Message Input */}
                        <div className="p-3 border-t border-surface-200 bg-white">
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              placeholder="Ketik pesan..."
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              className="flex-1 h-9 text-sm"
                            />
                            <Button
                              onClick={handleSendMessage}
                              className="bg-gradient-to-r from-primary-600 to-accent-500 h-9 w-9 p-0"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <MessageCircle className="w-12 h-12 text-surface-300 mx-auto mb-2" />
                          <p className="text-sm text-surface-500">Pilih chat untuk mulai</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isMinimized && (
                <div className="p-4 text-center">
                  <p className="text-sm text-surface-400">Chat diminimize</p>
                  <Button
                    onClick={() => setIsMinimized(false)}
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                  >
                    Buka
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
      )}
    </AnimatePresence>
  )
}

