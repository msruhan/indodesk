'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Check, ChevronRight, Clock, Package, X } from '@/lib/icons'
import type { CatalogViewMode } from '@/components/imei/catalog-view-toggle'
import { formatImeiPrice, type PublicServerService } from '@/lib/imei-public'
import { validateServerOrderFields } from '@/lib/server-fields'
import { ServerOrderFieldInput } from '@/components/imei/server-order-field-input'
import { cn } from '@/lib/utils'

function ServerFieldTags({ service }: { service: PublicServerService }) {
  const fieldLabels = service.fieldDefs.slice(0, 3).map((f) => f.label)
  const moreFields = service.fieldDefs.length > 3 ? service.fieldDefs.length - 3 : 0

  if (service.fieldDefs.length === 0) {
    return (
      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
        Field belum diset
      </span>
    )
  }

  return (
    <>
      {fieldLabels.map((label) => (
        <span
          key={label}
          className="rounded-md bg-surface-100 px-1.5 py-0.5 text-[9px] font-medium text-surface-600"
        >
          {label}
        </span>
      ))}
      {moreFields > 0 && (
        <span className="rounded-md bg-surface-100 px-1.5 py-0.5 text-[9px] text-surface-500">
          +{moreFields}
        </span>
      )}
    </>
  )
}

export function ServerServiceCard({
  service,
  onOrder,
  layout = 'grid',
}: {
  service: PublicServerService
  onOrder: (s: PublicServerService) => void
  layout?: CatalogViewMode
}) {
  const orderDisabled = service.fieldDefs.length === 0

  if (layout === 'list') {
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="group flex items-center gap-2 rounded-lg border border-surface-200/70 bg-white px-2 py-1.5 transition-all hover:border-amber-200/70 hover:shadow-soft-xs sm:gap-2.5 sm:px-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 sm:h-8 sm:w-8 sm:rounded-lg">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold leading-tight text-ink line-clamp-1 sm:text-xs">{service.title}</p>
            <div className="mt-0.5 hidden flex-wrap items-center gap-1 sm:flex">
              <Badge variant="warning" className="px-1 py-0 text-[8px]">{service.boxName}</Badge>
              <span className="hidden items-center gap-0.5 text-[9px] text-surface-500 md:flex">
                <Clock className="h-2 w-2" />
                {service.deliveryTime}
              </span>
            </div>
          </div>
          <div className="hidden max-w-[28%] flex-wrap justify-end gap-0.5 xl:flex">
            <ServerFieldTags service={service} />
          </div>
          <p className="shrink-0 text-[11px] font-bold tabular-nums text-amber-700 sm:text-xs">
            {formatImeiPrice(service.price)}
          </p>
          <Button
            variant="primary"
            size="sm"
            className="h-6 shrink-0 bg-amber-600 px-2 text-[10px] hover:bg-amber-700 sm:h-7 sm:px-2.5 sm:text-[11px]"
            onClick={() => onOrder(service)}
            disabled={orderDisabled}
          >
            Order
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="group overflow-hidden transition-all hover:border-amber-200/70 hover:shadow-soft-md">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 transition-transform group-hover:scale-105">
              <Package className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold leading-tight text-ink line-clamp-2 sm:text-sm">{service.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="warning" className="text-[9px] px-1.5 py-0">{service.boxName}</Badge>
                    <span className="flex items-center gap-0.5 text-[10px] text-surface-500">
                      <Clock className="h-2.5 w-2.5" />
                      {service.deliveryTime}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-amber-700 sm:text-base">{formatImeiPrice(service.price)}</p>
                </div>
              </div>
              {service.description && (
                <p className="mt-1.5 text-[11px] leading-relaxed text-surface-500 line-clamp-2">{service.description}</p>
              )}
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  <ServerFieldTags service={service} />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="h-7 bg-amber-600 px-3 text-[11px] hover:bg-amber-700"
                  onClick={() => onOrder(service)}
                  disabled={orderDisabled}
                >
                  Order
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ServerOrderModal({
  service,
  onClose,
}: {
  service: PublicServerService
  onClose: () => void
}) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(service.fieldDefs.map((f) => [f.key, ''])),
  )
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderCode, setOrderCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const ordersHref = '/imei/orders?tab=server'

  const canSubmit = useMemo(() => {
    if (service.fieldDefs.length === 0) return false
    return validateServerOrderFields(service.fieldDefs, fieldValues).ok
  }, [fieldValues, service.fieldDefs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const validation = validateServerOrderFields(service.fieldDefs, fieldValues)
      if (!validation.ok) {
        setError(validation.error ?? 'Data tidak valid')
        return
      }

      const res = await fetch('/api/imei/server-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          requiredFields: validation.fields,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        if (res.status === 401) {
          setError('Silakan login terlebih dahulu untuk membuat order.')
          return
        }
        setError(json.error ?? 'Gagal membuat order')
        return
      }
      setOrderCode(json.data?.orderCode ?? '')
      setSuccess(true)
    } catch {
      setError('Koneksi gagal. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-lg rounded-2xl border border-surface-200/70 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <Check className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-ink">Order Berhasil!</h3>
            <p className="mt-2 text-sm text-surface-500">
              Order server sedang diproses. Lacak status di riwayat order.
            </p>
            <div className="mt-4 rounded-xl bg-surface-50 p-3 text-left text-xs">
              {orderCode && (
                <div className="flex justify-between">
                  <span className="text-surface-500">Kode order</span>
                  <span className="font-mono font-medium text-ink">{orderCode}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between">
                <span className="text-surface-500">Service</span>
                <span className="font-medium text-ink">{service.title}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-surface-500">Harga</span>
                <span className="font-semibold text-amber-700">{formatImeiPrice(service.price)}</span>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href={ordersHref}>
                <Button variant="primary" size="sm" className="w-full bg-amber-600 hover:bg-amber-700 sm:w-auto">
                  Lihat riwayat order
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Tutup
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-ink">Order Server Service</h3>
                <p className="mt-0.5 text-xs text-surface-500">Isi data sesuai kebutuhan layanan</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/50 p-3">
              <p className="truncate text-xs font-semibold text-ink">{service.title}</p>
              <p className="text-[10px] text-surface-500">{service.boxName}</p>
              <p className="mt-1 text-[10px] font-semibold text-amber-700">{formatImeiPrice(service.price)}</p>
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
                {error.includes('login') && (
                  <Link href="/login" className="mt-1 block font-semibold underline">
                    Login sekarang
                  </Link>
                )}
              </div>
            )}

            {service.fieldDefs.length === 0 ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
                Layanan ini belum dikonfigurasi field order oleh admin. Silakan hubungi admin atau pilih
                layanan lain.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                {service.fieldDefs.map((field) => (
                  <ServerOrderFieldInput
                    key={field.key}
                    field={field}
                    value={fieldValues[field.key] ?? ''}
                    onChange={(v) => setFieldValues((prev) => ({ ...prev, [field.key]: v }))}
                  />
                ))}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? 'Memproses...' : `Submit Order — ${formatImeiPrice(service.price)}`}
                </Button>
              </form>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
