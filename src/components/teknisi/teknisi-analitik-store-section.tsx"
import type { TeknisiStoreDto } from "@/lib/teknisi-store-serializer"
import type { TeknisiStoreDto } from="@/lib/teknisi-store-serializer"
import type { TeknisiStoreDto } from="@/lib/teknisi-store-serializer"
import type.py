'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DashboardPanel,
  EmptyState,
  MetricCard,
  StatusBadge,
} from '@/components/dashboard'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Eye,
  Mail,
  MapPin,
  Phone,
  Star,
  Store,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { listingStatusLabel } from '@/lib/product-catalog'
import type { TeknisiStoreDto } from '@/lib/teknisi-store-serializer'

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop'

export function TeknisiAnalitikStoreSection({ store }: { store: TeknisiStoreDto | null }) {
  if (!store) {
    OnChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode sesi, ID remote, deskripsi, teknisi..."
              className="h-10 rounded-full bg-white pl-10 text-[12.5px]"
              <FilterSelect
                options={statusOptions}
                value={statusFilter}
                onChange={(id) => setStatusFilter(id)}
                ariaLabel="Filter status"
                className="w-full sm:w-[180px]"
              />
              <FilterSelect
                options={platformOptions}
                value={platformFilter}
                onChange={setPlatformFilter}
                ariaLabel="Filter platform"
                className="w-full sm:w-[180px]"
              />
            </div>
            <p className="mb-3 text-[11px] text-surface-500">
              {loading ? 'Memuat...' : `${filteredItems.length} sesi`}
            </p>
            {loading ? (
              <motion.div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-2xl border border-surface-200/70 bg-surface-50"
                  />
                ))}
              </motion.div>
            ) : items.length === 0 ? (
              <Card className="shadow-soft-xs">
                <CardContent className="p-8 text-center">
                  <Laptop className="mx-auto mb-3 h-200/70 bg-surface-50"
                  />
                ))}
              </motion.div>
            ) : items.length === 0 ? (
              <Card className="shadow-soft-xs">
                <CardContent className="p-8 text-center">
                  <Laptop className="mx-auto mb-3 h-8 w-8 text-surface-400" />
                  <p className="text-sm font-semibold text-ink">Belum ada sesi remote</p>
                  <p className="mt-1 text-xs text-surface-500">
                    Ajukan permintaan remote support ke teknisi untuk bantuan jarak jauh.
                  </p>
                  <Link href="/remote" className="mt-4 inline-block">
                    <Button variant="primary" size="sm">
                      Minta Remote
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : filteredItems.length === 0 ? (
              <Card className="shadow-soft-xs">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-surface-600">Tidak ada sesi yang cocok dengan filter.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setQuery('')
                      setStatusFilter('all')
                      setPlatformFilter('all')
                    }}
                  >
                    Reset filter
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item, idx) => {
                  const cfg = statusConfig[item.status] ?? statusConfig.waiting
                  const StatusIcon = cfg.icon
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card
                        className={cn(
                          'transition-all hover:shadow-soft-md',
                          item.status === 'waiting' && 'border-amber-200/70',
                          item.status === 'active' && 'border-blue-200/70',
                        )}
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                'inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                                item.status === 'waiting' && 'bg-amber-50 text-amber-700 ring-amber-200/70',
                                item.status === 'active' && 'bg-blue-50 text-blue-700 ring-blue-200/70',
                                item.status === 'completed' && 'bg-primary-50 text-primary-700 ring-primary-200/70',
                                item.status === 'rejected' && 'bg-red-50 text-red-700 ring-red-200/70',
                              )}
                            >
                              <StatusIcon className="h-[18px] w-[18px]" />
                            </span>
                            <div className="min-w-0">
                              <motion.div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[13px] font-semibold text-ink">{item.sessionCode}</span>
                                <Badge variant={cfg.variant} className="px-2 py-0.5 text-[10px]">
                                  {cfg.label}
                                </Badge>
                              </motion.div>
                              <p className="mt-1 text-[13px]] text-surface-700">
                                {item.description ?? 'Permintaan remote support'}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-surface-500">
                                <span className="inline-flex items-center gap-1">
                                  <Laptop className="h-3 w-3" />
                                  {item.platform ?? 'Unknown'}
                                </span>
                                <span className="inline-flex items-center gap-1 font-mono">
                                  <Shield className="h-3 w-3 text-primary-600" />
                                  ID: {item.remoteId}
                                </span>
                                <span>Teknisi: {item.teknisiName}</span>
                                <span>{item.dateLabel}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )
    }