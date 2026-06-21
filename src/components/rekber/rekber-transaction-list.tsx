'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Clock, CheckCircle, AlertCircle, XCircle, ArrowRight, Package } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { RekberDto, RekberStats } from '@/lib/rekber-serializer'
import { RekberSellerFulfillment } from '@/components/rekber/rekber-seller-fulfillment'
import type { ShippingCourier } from '@prisma/client'

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
  processing: { label: 'Diproses', className: 'bg-indigo-50 text-indigo-800', icon: Package },
  shipped: { label: 'Dikirim', className: 'bg-violet-50 text-violet-800', icon: ArrowRight },
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
  onUserAction?: (id: string, action: 'fund' | 'release' | 'cancel') => void
  onOpenComplaint?: (id: string) => void
  onRespondComplaint?: (id: string) => void
  onEscalateComplaint?: (id: string) => void
  onWithdrawComplaint?: (id: string) => void
  onAdminResolve?: (id: string, action: 'release' | 'refund') => void
  onAdvance?: (id: string) => void
  onSetShipment?: (id: string, courier: ShippingCourier, trackingNumber: string) => void
  showStats?: boolean
  emptyCtaHref?: string
  emptyCtaLabel?: string
  emptyMessage?: string
  showEmptyCta?: boolean
}

export function RekberTransactionList({
  items,
  stats,
  loading,
  actingId,
  onRefresh,
  onUserAction,
  onOpenComplaint,
  onRespondComplaint,
  onEscalateComplaint,
  onWithdrawComplaint,
  onAdminResolve,
  onAdvance,
  onSetShipment,
  showStats = true,
  emptyCtaHref,
  emptyCtaLabel,
  emptyMessage = 'Belum ada transaksi aman.',
  showEmptyCta = Boolean(emptyCtaHref && emptyCtaLabel),
}: Props) {
  return (
    <div className="space-y-3 sm:space-y-6">
      {showStats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} icon={Shield} />
          <StatCard label="Ditahan" value={stats.held} icon={Clock} />
          <StatCard label="Selesai" value={stats.released} icon={CheckCircle} />
          <StatCard label="Dispute" value={stats.disputed} icon={AlertCircle} />
        </div>
      )}

      {onRefresh && showStats && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24 p-4" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-surface-300" />
            <p className="text-sm text-surface-600">{emptyMessage}</p>
            {showEmptyCta && emptyCtaHref && emptyCtaLabel ? (
              <Link href={emptyCtaHref} className="mt-4 inline-block">
                <Button variant="primary" size="sm">
                  {emptyCtaLabel}
                </Button>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-4">
          {items.map((r) => {
            const cfg = statusConfig[r.status]
            const Icon = cfg.icon
            const busy = actingId === r.id
            return (
              <Card key={r.id} className="transition-shadow hover:shadow-soft-md">
                <CardContent className="p-2.5 sm:p-5">
                  <div className="flex flex-col gap-2 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:mb-2 sm:gap-2">
                        <h3 className="text-xs font-semibold text-ink sm:text-base">{r.orderCode}</h3>
                        <Badge className={cn(cfg.className, 'text-[9px] sm:text-xs')}>
                          <Icon className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
                          {r.statusLabel}
                        </Badge>
                      </div>
                      <div className="grid gap-1 text-[10px] sm:grid-cols-2 sm:gap-2 sm:text-sm">
                        <div>
                          <span className="text-surface-500">Pembeli: </span>
                          <span className="font-medium">{r.buyerName}</span>
                        </div>
                        <div>
                          <span className="text-surface-500">Penjual: </span>
                          <span className="font-medium">{r.sellerName}</span>
                          <Badge
                            className={cn(
                              'ml-1 align-middle text-[8px] font-semibold sm:ml-1.5 sm:text-[10px]',
                              r.sellerType === 'teknisi'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-surface-100 text-surface-700',
                            )}
                          >
                            {r.sellerTypeLabel}
                          </Badge>
                        </div>
                      </div>
                      {r.description && (
                        <p className="mt-1 line-clamp-2 text-[10px] text-surface-600 sm:mt-2 sm:text-sm">
                          {r.description}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] sm:mt-3 sm:gap-4 sm:text-sm">
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
                      <p className="mt-0.5 text-[9px] text-surface-400 sm:mt-1 sm:text-xs">{r.dateLabel}</p>
                      {r.complaint && (
                        <div className="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[10px] text-rose-800 sm:mt-2 sm:px-3 sm:py-2 sm:text-xs">
                          <p className="font-semibold">Komplain: {r.complaint.statusLabel}</p>
                          <p className="mt-0.5 line-clamp-2">{r.complaint.reason}</p>
                        </div>
                      )}
                      {r.tracking && r.role === 'buyer' && (
                        <div className="mt-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1.5 text-[10px] text-violet-900 sm:mt-2 sm:px-3 sm:py-2 sm:text-xs">
                          <p className="font-semibold">
                            {r.tracking.courierLabel} ·{' '}
                            <span className="font-mono">{r.tracking.trackingNumber}</span>
                          </p>
                          {r.tracking.summaryDesc && (
                            <p className="mt-0.5 line-clamp-2">{r.tracking.summaryDesc}</p>
                          )}
                        </div>
                      )}
                      {onAdvance && onSetShipment && onRefresh && (
                        <RekberSellerFulfillment
                          rekber={r}
                          busy={busy}
                          onRefresh={onRefresh}
                          onAdvance={onAdvance}
                          onSetShipment={onSetShipment}
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 sm:gap-2 [&_button]:h-7 [&_button]:px-2 [&_button]:text-[10px] sm:[&_button]:h-8 sm:[&_button]:px-3 sm:[&_button]:text-xs">
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
                      {r.canComplain && onOpenComplaint && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => onOpenComplaint(r.id)}
                        >
                          Ajukan komplain
                        </Button>
                      )}
                      {r.canRespondComplaint && onRespondComplaint && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => onRespondComplaint(r.id)}
                        >
                          Respons komplain
                        </Button>
                      )}
                      {r.canEscalateComplaint && onEscalateComplaint && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-700"
                          disabled={busy}
                          onClick={() => onEscalateComplaint(r.id)}
                        >
                          Eskalasi ke admin
                        </Button>
                      )}
                      {r.canWithdrawComplaint && onWithdrawComplaint && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-surface-700"
                          disabled={busy}
                          onClick={() => onWithdrawComplaint(r.id)}
                        >
                          Tarik komplain
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
                      {onAdminResolve &&
                        (r.status === 'held' ||
                          r.status === 'processing' ||
                          r.status === 'shipped' ||
                          r.status === 'disputed') && (
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
      <CardContent className="p-2.5 sm:p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium text-surface-500 sm:text-xs">{label}</p>
          <Icon className="h-3 w-3 text-primary-600 sm:h-4 sm:w-4" />
        </div>
        <p className="mt-0.5 text-lg font-bold tabular-nums text-ink sm:mt-1 sm:text-2xl">{value}</p>
      </CardContent>
    </Card>
  )
}
