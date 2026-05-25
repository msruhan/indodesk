'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DashboardPanel,
  EmptyState,
} from '@/components/dashboard'
import {
  ArrowRight,
  Eye,
  MapPin,
  ShoppingBag,
  Star,
  Store,
} from '@/lib/icons'
import type { TeknisiStoreDto } from '@/lib/teknisi-store-serializer'

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop'

export function TeknisiAnalitikStoreSection({ store }: { store: TeknisiStoreDto | null }) {
  if (!store) {
    return (
      <DashboardPanel
        title="Analitik Toko"
        description="Statistik performa toko handphone Anda di marketplace."
      >
        <EmptyState
          icon={Store}
          title="Belum ada toko"
          description="Buat profil toko untuk melihat rating, penjualan, dan statistik kunjungan."
          action={
            <Link href="/teknisi/toko">
              <Button variant="primary" size="sm">
                Kelola Toko
              </Button>
            </Link>
          }
        />
      </DashboardPanel>
    )
  }

  const locationLabel = [store.city].filter(Boolean).join(', ') || 'Indonesia'

  return (
    <DashboardPanel
      title="Analitik Toko"
      description="Statistik performa toko handphone Anda di marketplace."
      action={
        <Link href="/teknisi/toko">
          <Button variant="outline" size="sm" className="gap-1.5">
            Kelola toko
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      }
    >
      {/* Compact store card — cover + identity + inline stats */}
      <div className="overflow-hidden rounded-2xl border border-surface-200/70 bg-white transition-shadow hover:shadow-soft-md">
        {/* Cover — slim */}
        <div className="relative h-28 overflow-hidden sm:h-32">
          <img
            src={store.coverImage ?? DEFAULT_COVER}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Name overlay */}
          <div className="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/15 text-white backdrop-blur-md">
              <Store className="h-4 w-4" />
            </span>
            <div className="min-w-0 text-white">
              <h3 className="truncate text-[15px] font-bold tracking-tight">{store.name}</h3>
              <p className="flex items-center gap-1 text-[11px] text-white/80">
                <MapPin className="h-3 w-3" />
                {locationLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Stats strip — 3 inline metrics */}
        <div className="grid grid-cols-3 divide-x divide-surface-200/70 border-t border-surface-200/70">
          <StatCell
            label="Rating"
            value={store.rating > 0 ? store.rating.toFixed(1) : '—'}
            sub={`${store.reviewCount} ulasan`}
            icon={<Star className="h-3 w-3 text-amber-500" weight="fill" />}
          />
          <StatCell
            label="Terjual"
            value={store.totalPenjualan.toLocaleString('id-ID')}
            sub="Semua waktu"
            icon={<ShoppingBag className="h-3 w-3 text-primary-600" />}
          />
          <StatCell
            label="Dilihat"
            value={store.profileViews.toLocaleString('id-ID')}
            sub="30 hari"
            icon={<Eye className="h-3 w-3 text-blue-600" />}
          />
        </div>
      </div>
    </DashboardPanel>
  )
}

function StatCell({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
}) {
  return (
    <div className="px-3 py-3 text-center sm:px-4">
      <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.18em] text-surface-500">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-[16px] font-black tabular-nums tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[9px] text-surface-400">{sub}</p>
    </div>
  )
}
