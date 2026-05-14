'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/landing'
import { BottomNav } from '@/components/mobile'
import { 
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck
} from 'lucide-react'

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

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<string>('1')
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleSendMessage = () => {
    if (!message.trim()) return
    // In production, send to API
    setMessage('')
  }

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* Chat List */}
          <Card className="lg:col-span-1 flex flex-col">
            <div className="p-4 border-b border-surface-200">
              <h2 className="text-xl font-bold mb-4">Pesan</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-surface-400" />
                <Input
                  type="text"
                  placeholder="Cari chat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`w-full p-4 border-b border-surface-200 hover:bg-surface-50 transition-colors text-left ${
                    selectedChat === chat.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-surface-200"></div>
                      {chat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold truncate">{chat.name}</span>
                        <span className="text-xs text-surface-500">{chat.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-surface-400 truncate">{chat.lastMessage}</p>
                        {chat.unread > 0 && (
                          <Badge className="bg-primary-600 text-white text-xs">
                            {chat.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Chat Window */}
          <Card className="lg:col-span-2 flex flex-col">
            {currentChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-surface-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-surface-200"></div>
                      {currentChat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{currentChat.name}</div>
                      {currentChat.isOnline && (
                        <div className="text-xs text-green-600">Online</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {currentChat.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.sender === 'me'
                            ? 'bg-primary-600 text-white'
                            : 'bg-surface-100 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
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
                <div className="p-4 border-t border-surface-200">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Ketik pesan..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-primary-600 to-accent-500"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-200 mx-auto mb-4"></div>
                  <p className="text-surface-500">Pilih chat untuk mulai percakapan</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

