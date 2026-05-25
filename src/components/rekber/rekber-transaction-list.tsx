'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Clock, CheckCircle, AlertCircle, XCircle } from '@/lib/icons'
import type { RekberDto, RekberStats } from '@/lib/rekber-serializer'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

const statusConfig: Record<
  RekberDto['status'],
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: { label: 'Menunggu bayar', className: 'bg-amber-50 text-amber-800', icon: Clock },
  held: { label: 'Dana ditahan', className: 'bg-blue-50 text-blue-800', icon: Shield },
  released: { label: 'Selesai', className: 'bg-primary-50 text-primary-800', icon: CheckCircle },
  disputed: { label: 'Dispute', className: 'bg-rose-50 text-rose-800', icon: AlertCircle },
  refunded: { label: 'Refund', className: 'bg-surface-100 text-surface-700', icon: XCircle },
}

type Props = {
  items: RekberDto[]
  stats: RekberStats
  loading?: boolean
  actingId?: string | null
  onRefresh?: () => void
  onUserAction?: (id: string, action: 'fund' | 'release' | 'dispute' | 'cancel') => void
  onAdminResolve?: (id: string, action: 'release' | 'refund') => void
  showStats?: boolean
}

export function RekberTransactionList({
  items,
  stats,
  loading,
  actingId,
  onRefresh,
  onUserAction,
  onAdminResolve,
  showStats = true,
}: Props) {
  return (
    <div className="space-y-6">
      {showStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} icon={Shield} />
          <StatCard label="Ditahan" value={stats.held} icon={Clock} />
          <StatCard label="Selesai" value={stats.released} icon={CheckCircle} />
          <StatCard label="Dispute" value={stats.disputed} icon={AlertCircle} />
        </div>
      )}

      {onRefresh && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-surface-500">Memuat transaksi rekber…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-surface-300" />
            <p className="text-sm font-medium text-ink">Belum ada transaksi rekber</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((r) => {
            const cfg = statusConfig[r.status]
            const Icon = cfg.icon
            const busy = actingId === r.id
            return (
              <Card key={r.id} className="transition-shadow hover:shadow-soft-md">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-ink">{r.orderCode}</h3>
                        <Badge className={cfg.className}>
                          <Icon className="mr-1 h-3 w-3" />
                          {r.statusLabel}
                        </Badge>
                      </div>
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <span className="text-surface-500">Pembeli: </span>
                          <span className="font-medium">{r.buyerName}</span>
                        </div>
                        <div>
                          <span className="text-surface-500">Penjual: </span>
                          <span className="font-medium">{r.sellerName}</span>
                        </div>
                      </div>
                      {r.description && (
                        <p className="mt-2 text-sm text-surface-600">{r.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <span>
                          <span className="text-surface-500">Nominal: </span>
                          <span className="font-semibold tabular-nums">{formatPrice(r.amount)}</span>
                        </span>
                        <span>
                          <span className="text-surface-500">Fee: </span>
                          <span className="tabular-nums">{formatPrice(r.fee)}</span>
                        </span>
                        <span>
                          <span className="text-surface-500">Total: </span>
                          <span className="font-bold text-primary-700 tabular-nums">
                            {formatPrice(r.totalHold)}
                          </span>
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-surface-400">{r.dateLabel}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {r.canFund && onUserAction && (
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={busy}
                          onClick={() => onUserAction(r.id, 'fund')}
                        >
                          Bayar & tahan dana
                        </Button>
                      )}
                      {r.canRelease && onUserAction && (
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={busy}
                          onClick={() => onUserAction(r.id, 'release')}
                        >
                          Konfirmasi terima
                        </Button>
                      )}
                      {r.canDispute && onUserAction && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => onUserAction(r.id, 'dispute')}
                        >
                          Dispute
                        </Button>
                      )}
                      {r.canCancel && onUserAction && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600"
                          disabled={busy}
                          onClick={() => onUserAction(r.id, 'cancel')}
                        >
                          Batal
                        </Button>
                      )}
                      {onAdminResolve && (r.status === 'held' || r.status === 'disputed') && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={busy}
                            onClick={() => onAdminResolve(r.id, 'release')}
                          >
                            Release ke penjual
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600"
                            disabled={busy}
                            onClick={() => onAdminResolve(r.id, 'refund')}
                          >
                            Refund pembeli
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof Shield
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-surface-500">{label}</p>
          <Icon className="h-4 w-4 text-primary-600" />
        </div>
        <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{value}</p>
      </CardContent>
    </Card>
  )
}
