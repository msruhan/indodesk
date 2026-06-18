'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { ChatConversationDto, ChatMessageDto } from '@/lib/chat-serializer'
import { handleStaleSessionResponse } from '@/lib/handle-stale-session'

const POLL_MS = 5000
const MESSAGE_POLL_MS = 3000

export type UseChatMessengerReturn = {
  isAuthenticated: boolean
  isLoading: boolean
  isConnectingPeer: boolean
  loadingMessages: boolean
  sending: boolean
  error: string | null
  conversations: ChatConversationDto[]
  messages: ChatMessageDto[]
  selectedId: string | null
  currentConversation: ChatConversationDto | null
  totalUnread: number
  setSelectedId: (id: string | null) => void
  sendMessage: (body: string) => Promise<boolean>
  reload: () => Promise<void>
}

export function useChatMessenger(options?: {
  peerId?: string | null
  /** Poll conversation list (unread counts). */
  poll?: boolean
  /** Poll messages for the active conversation. */
  pollMessages?: boolean
  autoConnectPeer?: boolean
}): UseChatMessengerReturn {
  const { data: session, status } = useSession()
  const userId = session?.user?.id
  const poll = options?.poll ?? true
  const pollMessages = options?.pollMessages ?? false
  const autoConnectPeer = options?.autoConnectPeer ?? false

  const [conversations, setConversations] = useState<ChatConversationDto[]>([])
  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isConnectingPeer, setIsConnectingPeer] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectRequestRef = useRef(0)
  const lastConnectedPeerRef = useRef<string | null>(null)
  const convActivityRef = useRef<Map<string, string>>(new Map())

  const loadConversations = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/chat/conversations', { cache: 'no-store' })
      const data = await res.json()
      if (await handleStaleSessionResponse(res, data)) return
      if (data.success) {
        setConversations(data.data)
        setError(null)
      } else {
        setError(data.error || 'Gagal memuat percakapan')
      }
    } catch {
      setError('Gagal memuat percakapan')
    } finally {
      setLoadingList(false)
    }
  }, [userId])

  const openOrCreatePeer = useCallback(
    async (peerId: string) => {
      if (!userId) return null

      const applyConversation = (conv: ChatConversationDto) => {
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === conv.id)
          if (exists) return prev.map((c) => (c.id === conv.id ? conv : c))
          return [conv, ...prev]
        })
        setSelectedId(conv.id)
        setError(null)
        return conv.id
      }

      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerId }),
      })
      const data = await res.json()
      if (await handleStaleSessionResponse(res, data)) return null
      if (data.success) {
        return applyConversation(data.data as ChatConversationDto)
      }

      const listRes = await fetch('/api/chat/conversations')
      const listData = await listRes.json()
      if (listData.success) {
        const list = listData.data as ChatConversationDto[]
        setConversations(list)
        const existing = list.find((c) => c.peerId === peerId)
        if (existing) {
          setError(null)
          setSelectedId(existing.id)
          return existing.id
        }
      }

      setError(data.error || 'Gagal membuka chat')
      return null
    },
    [userId],
  )

  const markRead = useCallback(async (conversationId: string) => {
    await fetch(`/api/chat/conversations/${conversationId}/read`, { method: 'POST' })
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)),
    )
    setMessages((prev) =>
      prev.map((m) => (m.isMine ? m : { ...m, read: true })),
    )
  }, [])

  const loadMessages = useCallback(
    async (conversationId: string, silent = false) => {
      if (!userId) return
      if (!silent) setLoadingMessages(true)
      try {
        const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
          cache: 'no-store',
        })
        const data = await res.json()
        if (data.success) {
          setMessages(data.data)
          if (silent) {
            void markRead(conversationId)
          }
        }
      } catch {
        if (!silent) setError('Gagal memuat pesan')
      } finally {
        if (!silent) setLoadingMessages(false)
      }
    },
    [userId, markRead],
  )

  const selectConversation = useCallback(
    (id: string | null) => {
      if (!id) {
        setSelectedId(null)
        setMessages([])
        return
      }
      setSelectedId(id)
      void loadMessages(id)
      void markRead(id)
    },
    [loadMessages, markRead],
  )

  const connectToPeer = useCallback(
    async (peerId: string) => {
      if (!userId) return

      const requestId = ++connectRequestRef.current
      setIsConnectingPeer(true)
      setError(null)

      try {
        const conversationId = await openOrCreatePeer(peerId)
        if (!conversationId || requestId !== connectRequestRef.current) return

        await loadMessages(conversationId)
        if (requestId !== connectRequestRef.current) return
        await markRead(conversationId)
        await loadConversations()
      } finally {
        if (requestId === connectRequestRef.current) {
          setIsConnectingPeer(false)
        }
      }
    },
    [userId, openOrCreatePeer, loadMessages, markRead, loadConversations],
  )

  const sendMessage = useCallback(
    async (body: string) => {
      if (!selectedId || !body.trim() || sending) return false
      setSending(true)
      const optimistic: ChatMessageDto = {
        id: `tmp-${Date.now()}`,
        body: body.trim(),
        senderId: userId!,
        isMine: true,
        timestamp: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        read: false,
      }
      setMessages((prev) => [...prev, optimistic])

      try {
        const res = await fetch(`/api/chat/conversations/${selectedId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: body.trim() }),
        })
        const data = await res.json()
        if (!data.success) {
          setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
          setError(data.error || 'Gagal mengirim pesan')
          return false
        }
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimistic.id),
          data.data as ChatMessageDto,
        ])
        await loadConversations()
        return true
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
        setError('Gagal mengirim pesan')
        return false
      } finally {
        setSending(false)
      }
    },
    [selectedId, sending, userId, loadConversations],
  )

  useEffect(() => {
    if (status === 'authenticated' && userId) {
      void loadConversations()
    }
    if (status === 'unauthenticated') {
      setLoadingList(false)
    }
  }, [status, userId, loadConversations])

  useEffect(() => {
    const peerId = options?.peerId
    if (!autoConnectPeer || !peerId || !userId) {
      if (!peerId) lastConnectedPeerRef.current = null
      return
    }

    if (lastConnectedPeerRef.current === peerId) return
    lastConnectedPeerRef.current = peerId

    void connectToPeer(peerId)

    return () => {
      connectRequestRef.current += 1
    }
  }, [options?.peerId, userId, autoConnectPeer, connectToPeer])

  useEffect(() => {
    if (!pollMessages || !selectedId) return

    const active = conversations.find((c) => c.id === selectedId)
    if (!active) return

    const snapshot = `${active.lastMessage ?? ''}|${active.unread}|${active.timestamp}`
    const prev = convActivityRef.current.get(selectedId)
    if (prev !== undefined && prev !== snapshot) {
      void loadMessages(selectedId, true)
    }
    convActivityRef.current.set(selectedId, snapshot)
  }, [conversations, selectedId, pollMessages, loadMessages])

  useEffect(() => {
    if (!poll || !userId) return
    const tick = () => void loadConversations()
    tick()
    const interval = setInterval(tick, POLL_MS)
    return () => clearInterval(interval)
  }, [poll, userId, loadConversations])

  useEffect(() => {
    if (!pollMessages || !selectedId || !userId) return
    const tick = () => void loadMessages(selectedId, true)
    tick()
    const interval = setInterval(tick, MESSAGE_POLL_MS)
    return () => clearInterval(interval)
  }, [pollMessages, selectedId, userId, loadMessages])

  useEffect(() => {
    if (!pollMessages || !selectedId) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadMessages(selectedId, true)
        void loadConversations()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [pollMessages, selectedId, loadMessages, loadConversations])

  const currentConversation = conversations.find((c) => c.id === selectedId) ?? null
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading' || loadingList,
    isConnectingPeer,
    loadingMessages,
    sending,
    error,
    conversations,
    messages,
    selectedId,
    currentConversation,
    totalUnread,
    setSelectedId: selectConversation,
    sendMessage,
    reload: loadConversations,
  }
}
