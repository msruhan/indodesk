'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight, Clock, Unlock } from '@/lib/icons'
import { formatImeiPrice, type PublicImeiService } from '@/lib/imei-public'
import type { CatalogViewMode } from '@/components/imei/catalog-view-toggle'

function FieldTags({ service }: { service: PublicImeiService }) {
  return (
    <>
      {service.requiresImei && (
        <span className="rounded bg-surface-100 px-1 py-0.5 text-[8px] font-medium text-surface-600 lg:rounded-md lg:px-1.5 lg:text-[9px]">
          Perangkat
        </span>
      )}
      {service.requiresNetwork && (
        <span className="rounded bg-surface-100 px-1 py-0.5 text-[8px] font-medium text-surface-600 lg:rounded-md lg:px-1.5 lg:text-[9px]">
          Network
        </span>
      )}
      {service.requiresModel && (
        <span className="rounded bg-surface-100 px-1 py-0.5 text-[8px] font-medium text-surface-600 lg:rounded-md lg:px-1.5 lg:text-[9px]">
          Model
        </span>
      )}
      {service.requiresProvider && (
        <span className="rounded bg-surface-100 px-1 py-0.5 text-[8px] font-medium text-surface-600 lg:rounded-md lg:px-1.5 lg:text-[9px]">
          Provider
        </span>
      )}
    </>
  )
}

export function ImeiServiceCard({
  service,
  onOrder,
  layout = 'grid',
}: {
  service: PublicImeiService
  onOrder: (s: PublicImeiService) => void
  layout?: CatalogViewMode
}) {
  if (layout === 'list') {
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="group flex items-center gap-2 rounded-lg border border-surface-200/70 bg-white px-2 py-1.5 transition-all hover:border-primary-200/70 hover:shadow-soft-xs sm:gap-2.5 sm:px-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700 sm:h-8 sm:w-8 sm:rounded-lg">
            <Unlock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold leading-tight text-ink line-clamp-1 sm:text-xs">{service.title}</p>
            <div className="mt-0.5 hidden flex-wrap items-center gap-1 sm:flex">
              <Badge variant="info" className="px-1 py-0 text-[8px]">
                {service.groupName}
              </Badge>
              <span className="hidden items-center gap-0.5 text-[9px] text-surface-500 md:flex">
                <Clock className="h-2 w-2" />
                {service.deliveryTime}
              </span>
            </div>
          </div>
          <div className="hidden max-w-[28%] flex-wrap justify-end gap-0.5 xl:flex">
            <FieldTags service={service} />
          </div>
          <p className="shrink-0 text-[11px] font-bold tabular-nums text-primary-600 sm:text-xs">
            {formatImeiPrice(service.price)}
          </p>
          <Button
            variant="primary"
            size="sm"
            className="h-6 shrink-0 px-2 text-[10px] sm:h-7 sm:px-2.5 sm:text-[11px]"
            onClick={() => onOrder(service)}
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
      <Card className="group overflow-hidden transition-all hover:border-primary-200/70 hover:shadow-soft-md">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700 transition-transform group-hover:scale-105">
              <Unlock className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold leading-tight text-ink line-clamp-2 sm:text-sm">
                    {service.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="info" className="text-[9px] px-1.5 py-0">
                      {service.groupName}
                    </Badge>
                    <span className="flex items-center gap-0.5 text-[10px] text-surface-500">
                      <Clock className="h-2.5 w-2.5" />
                      {service.deliveryTime}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-primary-600 sm:text-base">{formatImeiPrice(service.price)}</p>
                </div>
              </div>
              {service.description && (
                <p className="mt-1.5 text-[11px] leading-relaxed text-surface-500 line-clamp-2">
                  {service.description}
                </p>
              )}
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  <FieldTags service={service} />
                </div>
                <Button variant="primary" size="sm" className="h-7 px-3 text-[11px]" onClick={() => onOrder(service)}>
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

export function ImeiServiceCardSkeleton({ layout = 'grid' }: { layout?: CatalogViewMode }) {
  if (layout === 'list') {
    return (
      <div className="flex animate-pulse items-center gap-2 rounded-lg border border-surface-200/70 bg-white px-3 py-2">
        <div className="h-8 w-8 rounded-lg bg-surface-200" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-3/4 rounded bg-surface-200" />
          <div className="h-2.5 w-1/3 rounded bg-surface-100" />
        </div>
        <div className="h-7 w-16 rounded-lg bg-surface-200" />
      </div>
    )
  }

  return (
    <Card className="overflow-hidden animate-pulse">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-xl bg-surface-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-surface-200" />
            <div className="h-3 w-1/2 rounded bg-surface-100" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
