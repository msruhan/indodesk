import { Suspense } from 'react'
import { ChatView } from '@/components/chat/chat-view'

function TeknisiChatPageContent() {
  return (
    <div className="flex h-[calc(100dvh-7.5rem)] max-lg:h-[calc(100dvh-11rem)] min-h-0 flex-col gap-4">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Chat</h1>
        <p className="mt-1 text-sm text-surface-500">Balas pesan dari customer.</p>
      </div>
      <ChatView className="min-h-0 flex-1 !h-full max-h-none" />
    </div>
  )
}

export default function TeknisiChatPage() {
  return (
    <Suspense fallback={<p className="text-sm text-surface-500">Memuat chat...</p>}>
      <TeknisiChatPageContent />
    </Suspense>
  )
}
