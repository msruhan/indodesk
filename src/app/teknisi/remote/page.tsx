'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  Clock,
  Eye,
  Laptop,
  MessageCircle,
  Radio,
  Shield,
  Users,
  X,
  XCircle,
} from '@/lib/icons'

interface RemoteRequest {
  id: string
  userName: string
  userAvatar: number
  remoteId: string
  description: string
  platform: string
  requestedAt: string
  status: 'waiting' | 'accepted' | 'rejected' | 'completed'
}

const mockRequests: RemoteRequest[] = [
  {
    id: 'r1',
    userName: 'Budi Santoso',
    userAvatar: 31,
    remoteId: '987 654 321',
    description: 'iPhone stuck di logo Apple setelah update iOS. Butuh bantuan restore via remote.',
    platform: 'Windows 11',
    requestedAt: '2 menit lalu',
    status: 'waiting',
  },
  {
    id: 'r2',
    userName: 'Siti Nurhaliza',
    userAvatar: 32,
    remoteId: '456 123 789',
    description: 'Minta tolong install custom ROM di Xiaomi Redmi Note 12.',
    platform: 'Windows 10',
    requestedAt: '8 menit lalu',
    status: 'waiting',
  },
  {
    id: 'r3',
    userName: 'Rudi Hartono',
    userAvatar: 33,
    remoteId: '111 222 333',
    description: 'Unlock bootloader Samsung A54.',
    platform: 'macOS',
    requestedAt: '25 menit lalu',
    status: 'accepted',
  },
  {
    id: 'r4',
    userName: 'Dewi Lestari',
    userAvatar: 34,
    remoteId: '444 555 666',
    description: 'Backup data sebelum factory reset.',
    platform: 'Windows 11',
    requestedAt: '1 jam lalu',
    status: 'completed',
  },
]

const statusConfig = {
  waiting: { label: 'Menunggu', variant: 'warning' as const, icon: Clock },
  accepted: { label: 'Aktif', variant: 'success' as const, icon: Radio },
  rejected: { label: 'Ditolak', variant: 'danger' as const, icon: XCircle },
  completed: { label: 'Selesai', variant: 'default' as const, icon: CheckCircle },
}

export default function TeknisiRemotePage() {
  const [requests, setRequests] = useState(mockRequests)

  const handleAccept = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'accepted' as const } : r)),
    )
  }

  const handleReject = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' as const } : r)),
    )
  }

  const waiting = requests.filter((r) => r.status === 'waiting')
  const active = requests.filter((r) => r.status === 'accepted')
  const history = requests.filter((r) => r.status === 'completed' || r.status === 'rejected')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink">Remote Requests</h1>
          <p className="mt-1 text-sm text-surface-500">
            Kelola permintaan remote dari user yang membutuhkan bantuan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="px-2.5 py-1">
            <Clock className="mr-1 h-3 w-3" />
            {waiting.length} menunggu
          </Badge>
          <Badge variant="success" className="px-2.5 py-1">
            <Radio className="mr-1 h-3 w-3" />
            {active.length} aktif
          </Badge>
        </div>
      </div>

      {/* Waiting requests */}
      {waiting.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-surface-600">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Menunggu aksi Anda ({waiting.length})
          </h2>
          <div className="space-y-3">
            {waiting.map((req) => (
              <RequestCard key={req.id} request={req} onAccept={handleAccept} onReject={handleReject} />
            ))}
          </div>
        </section>
      )}

      {/* Active sessions */}
      {active.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-surface-600">
            <Radio className="h-3.5 w-3.5 text-primary-600" />
            Sesi aktif ({active.length})
          </h2>
          <div className="space-y-3">
            {active.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        </section>
      )}

      {/* History */}
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
              Request dari user akan muncul di sini secara real-time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function RequestCard({
  request: req,
  onAccept,
  onReject,
}: {
  request: RemoteRequest
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
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
      <Card className={cn(
        'shadow-soft-xs transition-all duration-300',
        req.status === 'waiting' && 'border-amber-200/70 bg-amber-50/20',
        req.status === 'accepted' && 'border-primary-200/70 bg-primary-50/20',
      )}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <img
              src={`https://i.pravatar.cc/150?img=${req.userAvatar}`}
              alt={req.userName}
              className="h-11 w-11 flex-shrink-0 rounded-full border-2 border-white object-cover shadow-soft-xs"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-ink">{req.userName}</span>
                <Badge variant={cfg.variant} className="text-[10px] px-1.5 py-0.5">
                  <StatusIcon className="mr-0.5 h-2.5 w-2.5" />
                  {cfg.label}
                </Badge>
                <span className="text-[10px] text-surface-500">{req.requestedAt}</span>
              </div>

              <p className="mb-2 text-[13px] leading-relaxed text-surface-700">
                {req.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-surface-500">
                <span className="flex items-center gap-1">
                  <Laptop className="h-3 w-3" />
                  {req.platform}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Shield className="h-3 w-3 text-primary-600" />
                  ID: {req.remoteId}
                </span>
              </div>

              {/* Actions for waiting */}
              {req.status === 'waiting' && onAccept && onReject && (
                <div className="mt-3 flex items-center gap-2 border-t border-surface-100 pt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-9"
                    onClick={() => onAccept(req.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Terima & Connect
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                    onClick={() => onReject(req.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Tolak
                  </Button>
                  <Button variant="ghost" size="sm" className="ml-auto h-9">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat
                  </Button>
                </div>
              )}

              {/* Active session actions */}
              {req.status === 'accepted' && (
                <div className="mt-3 flex items-center gap-2 border-t border-surface-100 pt-3">
                  <Button variant="primary" size="sm" className="h-9">
                    <Eye className="h-3.5 w-3.5" />
                    Buka IndoDesk
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9">
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
