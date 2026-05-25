'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { useChat } from '@/contexts/chat-context'
import { openTeknisiChat } from '@/lib/open-teknisi-chat'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  Clock,
  Eye,
  Laptop,
  Lock,
  MessageCircle,
  Radio,
  RefreshCw,
  Shield,
  X,
  XCircle,
} from '@/lib/icons'
import type { TeknisiRemoteDto } from '@/lib/teknisi-layanan-serializer'

const statusConfig = {
  waiting: { label: 'Menunggu', variant: 'warning' as const, icon: Clock },
  active: { label: 'Aktif', variant: 'success' as const, icon: Radio },
  rejected: { label: 'Ditolak', variant: 'danger' as const, icon: XCircle },
  completed: { label: 'Selesai', variant: 'default' as const, icon: CheckCircle },
}

function UserAvatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="h-11 w-11 flex-shrink-0 rounded-full border-2 border-white object-cover shadow-soft-xs"
      />
    )
  }
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-primary-100 text-xs font-bold text-primary-700 shadow-soft-xs">
      {initials || 'U'}
    </div>
  )
}

export default function TeknisiRemotePage() {
  const router = useRouter()
  const { status } = useSession()
  const { openChatWithPeer } = useChat()
  const [requests, setRequests] = useState<TeknisiRemoteDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const handleChatUser = useCallback(
    (userId: string) => {
      openTeknisiChat({
        teknisiUserId: userId,
        isAuthenticated: status === 'authenticated',
        role: 'TEKNISI',
        openChatWithPeer,
        navigate: router.push,
      })
    },
    [status, openChatWithPeer, router],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/teknisi/remote')
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memuat request remote')
        return
      }
      setRequests(json.data.items)
    } catch {
      setError('Gagal memuat request remote')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const patchAction = async (id: string, action: 'accept' | 'reject' | 'complete') => {
    setActingId(id)
    try {
      const res = await fetch(`/api/teknisi/remote/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memperbarui request')
        return
      }
      await load()
    } catch {
      setError('Gagal memperbarui request')
    } finally {
      setActingId(null)
    }
  }

  const waiting = requests.filter((r) => r.status === 'waiting')
  const active = requests.filter((r) => r.status === 'active')
  const history = requests.filter((r) => r.status === 'completed' || r.status === 'rejected')

  return (
    <div className="space-y-6">
      <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink">Remote Requests</h1>
          <p className="mt-1 text-sm text-surface-500">
            Kelola permintaan remote dari user yang membutuhkan bantuan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
          <Badge variant="warning" className="px-2.5 py-1">
            <Clock className="mr-1 h-3 w-3" />
            {waiting.length} menunggu
          </Badge>
          <Badge variant="success" className="px-2.5 py-1">
            <Radio className="mr-1 h-3 w-3" />
            {active.length} aktif
          </Badge>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-surface-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Memuat request remote...
        </div>
      ) : (
        <>
          {waiting.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-surface-600">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                Menunggu aksi Anda ({waiting.length})
              </h2>
              <div className="space-y-3">
                {waiting.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    acting={actingId === req.id}
                    onAccept={(id) => void patchAction(id, 'accept')}
                    onReject={(id) => void patchAction(id, 'reject')}
                    onChatUser={handleChatUser}
                  />
                ))}
              </div>
            </section>
          )}

          {active.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-surface-600">
                <Radio className="h-3.5 w-3.5 text-primary-600" />
                Sesi aktif ({active.length})
              </h2>
              <motion.div className="space-y-3">
                {active.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    acting={actingId === req.id}
                    onComplete={(id) => void patchAction(id, 'complete')}
                    onChatUser={handleChatUser}
                  />
                ))}
              </motion.div>
            </section>
          )}

          {history.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-surface-600">
                <CheckCircle className="h-3.5 w-3.5 text-surface-400" />
                Riwayat ({history.length})
              </h2>
              <div className="space-y-3">
                {history.map((req) => (
                  <RequestCard key={req.id} request={req} />
                ))}
              </div>
            </section>
          )}

          {requests.length === 0 && (
            <Card className="shadow-soft-xs">
              <CardContent className="p-8 text-center">
                <Laptop className="mx-auto mb-3 h-8 w-8 text-surface-400" />
                <p className="text-sm font-semibold text-ink">Belum ada request remote</p>
                <p className="mt-1 text-xs text-surface-500">
                  Request dari user akan muncul di sini setelah user memilih Anda sebagai teknisi.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function RequestCard({
  request: req,
  acting,
  onAccept,
  onReject,
  onComplete,
  onChatUser,
}: {
  request: TeknisiRemoteDto
  acting?: boolean
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
  onComplete?: (id: string) => void
  onChatUser?: (userId: string) => void
}) {
  const cfg = statusConfig[req.status]
  const StatusIcon = cfg.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        className={cn(
          'shadow-soft-xs transition-all duration-300',
          req.status === 'waiting' && 'border-amber-200/70 bg-amber-50/20',
          req.status === 'active' && 'border-primary-200/70 bg-primary-50/20',
        )}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <UserAvatar name={req.userName} image={req.userImage} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-ink">{req.userName}</span>
                <Badge variant={cfg.variant} className="px-1.5 py-0.5 text-[10px]">
                  <StatusIcon className="mr-0.5 h-2.5 w-2.5" />
                  {cfg.label}
                </Badge>
                <span className="text-[10px] text-surface-500">{req.requestedAt}</span>
              </div>

              <p className="mb-2 text-[13px] leading-relaxed text-surface-700">{req.description}</p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-surface-500">
                <span className="flex items-center gap-1">
                  <Laptop className="h-3 w-3" />
                  {req.platform}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Shield className="h-3 w-3 text-primary-600" />
                  ID: {req.remoteId}
                </span>
                {req.remoteOtp && (
                  <span className="flex items-center gap-1 font-mono text-primary-700">
                    <Lock className="h-3 w-3" />
                    OTP: {req.remoteOtp}
                  </span>
                )}
              </div>

              {req.status === 'waiting' && onAccept && onReject && (
                <div className="mt-3 flex items-center gap-2 border-t border-surface-100 pt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-9"
                    disabled={acting}
                    onClick={() => onAccept(req.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Terima
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                    disabled={acting}
                    onClick={() => onReject(req.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Tolak
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-9"
                    onClick={() => onChatUser?.(req.userId)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat
                  </Button>
                </div>
              )}

              {req.status === 'active' && onComplete && (
                <div className="mt-3 flex items-center gap-2 border-t border-surface-100 pt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-9"
                    disabled={!req.remoteOtp}
                    onClick={() => {
                      if (req.remoteOtp) {
                        void navigator.clipboard.writeText(
                          `ID: ${req.remoteId}\nOTP: ${req.remoteOtp}`,
                        )
                      }
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Salin kredensial
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={acting}
                    onClick={() => onComplete(req.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Selesai
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9"
                    onClick={() => onChatUser?.(req.userId)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat user
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
