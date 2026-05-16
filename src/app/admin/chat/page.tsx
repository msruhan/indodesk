import { ChatView } from '@/components/chat/chat-view'

export default function AdminChatPage() {
  return (
    <div className="flex h-[calc(100dvh-7.5rem)] max-lg:h-[calc(100dvh-11rem)] min-h-0 flex-col gap-4">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Chat</h1>
        <p className="mt-1 text-sm text-surface-500">Kelola percakapan dengan user, teknisi, dan mitra.</p>
      </div>
      <ChatView className="min-h-0 flex-1 !h-full max-h-none" />
    </div>
  )
}
