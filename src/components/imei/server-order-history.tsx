'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { X, Copy } from '@/lib/icons'
import { cn } from '@/lib/utils'
import {
  formatImeiDate,
  formatImeiPrice,
  isSystemComment,
  type ImeiOrderStatusUi,
  type PublicServerOrder,
} from '@/lib/imei-public'
import { formatOrderFieldEntries } from '@/lib/server-fields'

const statusConfig: Record<
  ImeiOrderStatusUi,
  { label: string; variant: 'warning' | 'info' | 'success' | 'danger' }
> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  IN_PROCESS: { label: 'Diproses', variant: 'info' },
  SUCCESS: { label: 'Berhasil', variant: 'success' },
  REJECTED: { label: 'Ditolak', variant: 'danger' },
  CANCELLED: { label: 'Dibatalkan', variant: 'danger' },
}

export function serverOrderSummary(order: PublicServerOrder): string {
  const entries = formatOrderFieldEntries(order.requiredFields, order.serviceRequiredFields)
  if (entries.length > 0) {
    return entries
      .slice(0, 2)
      .map((e) => e.value)
      .join(' · ')
  }
  if (order.email) return order.email
  return '—'
}

export function ServerOrderDetailSheet({
  order,
  onClose,
  statusIconClass,
  StatusIcon,
}: {
  order: PublicServerOrder
  onClose: () => void
  statusIconClass: (status: ImeiOrderStatusUi) => string
  StatusIcon: React.ComponentType<{ className?: string }>
}) {
  const config = statusConfig[order.status]
  const fieldEntries = formatOrderFieldEntries(order.requiredFields, order.serviceRequiredFields)
  const systemNote = isSystemComment(order.comments) ? order.comments : null
  const adminComment =
    order.comments && !isSystemComment(order.comments) ? order.comments : null
  const codeBoxClass =
    order.status === 'SUCCESS'
      ? 'border-primary-100 bg-primary-50/50'
      : order.status === 'REJECTED' || order.status === 'CANCELLED'
        ? 'border-red-100 bg-red-50/40'
        : 'border-surface-200 bg-surface-50'

  const copyCode = () => {
    if (order.code) navigator.clipboard.writeText(order.code)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-surface-200/70 bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-surface-200 sm:hidden" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                statusIconClass(order.status),
              )}
            >
              <StatusIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{order.orderCode}</p>
              <Badge variant={config.variant} className="mt-0.5 text-[9px]">
                {config.label}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="rounded-xl bg-surface-50 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <p className="text-[10px] text-surface-500">Service</p>
                <p className="mt-0.5 text-xs font-medium text-ink">{order.serviceName}</p>
                {order.boxName && (
                  <p className="text-[10px] text-surface-400">{order.boxName}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-surface-500">Harga</p>
                <p className="mt-0.5 text-xs font-bold text-amber-700">{formatImeiPrice(order.price)}</p>
              </div>
              <div>
                <p className="text-[10px] text-surface-500">Dibuat</p>
                <p className="mt-0.5 text-[11px] text-ink">{formatImeiDate(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {fieldEntries.length > 0 && (
            <div className="rounded-xl bg-surface-50 p-3">
              <p className="text-[10px] font-medium text-surface-600 mb-1">Data order</p>
              {fieldEntries.map((entry) => (
                <div key={entry.label} className="flex justify-between gap-2 py-0.5 text-[11px]">
                  <span className="text-surface-500 shrink-0">{entry.label}</span>
                  <span className="font-medium text-ink text-right break-all">{entry.value}</span>
                </div>
              ))}
            </div>
          )}

          {order.code && (
            <div className={cn('rounded-xl border p-3', codeBoxClass)}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-ink">
                  {order.status === 'SUCCESS' ? 'Hasil (CODE supplier)' : 'CODE supplier'}
                </p>
                <button
                  type="button"
                  onClick={copyCode}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-primary-600 hover:bg-white/80"
                >
                  <Copy className="h-2.5 w-2.5" />
                  Copy
                </button>
              </div>
              <pre className="mt-1.5 whitespace-pre-wrap rounded-lg bg-white/70 p-2 text-[11px] leading-relaxed text-ink">
                {order.code}
              </pre>
            </div>
          )}

          {systemNote && (
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-3">
              <p className="text-[10px] font-medium text-surface-600">Catatan sistem</p>
              <p className="mt-0.5 text-xs text-ink">{systemNote}</p>
            </div>
          )}

          {adminComment && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
              <p className="text-[10px] font-medium text-amber-700">Komentar dari admin</p>
              <p className="mt-0.5 text-xs text-ink">{adminComment}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
