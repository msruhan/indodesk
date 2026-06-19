'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { cn } from '@/lib/utils'
import {
  Search,
  Star,
  MapPin,
  Clock,
  ShoppingBag,
  Award,
  CheckCircle,
} from '@/lib/icons'
import Link from 'next/link'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { mitraTabs } from '@/lib/section-tab-config'
import { PageHero } from '@/components/shared/page-hero'
import type { PublicStoreListItemDto } from '@/lib/teknisi-store-serializer'

const badgeConfig: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  'trusted-store': { label: 'Trusted Store', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  'top-seller': { label: 'Top Seller', color: 'bg-yellow-100 text-yellow-700', icon: Award },
}

const defaultCover =
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop'

export default function TokoListPage() {
  const [stores, setStores] = useState<PublicStoreListItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('Semua Kota')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/stores')
        const json = await res.json()
        if (cancelled) return
        if (res.ok && json.success) {
          setStores(json.data ?? [])
        }
      } catch {
        if (!cancelled) setStores([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const cities = useMemo(() => {
    const set = new Set(stores.map((s) => s.city).filter(Boolean) as string[])
    return ['Semua Kota', ...Array.from(set).sort()]
  }, [stores])

  const filteredToko = stores.filter((toko) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      toko.name.toLowerCase().includes(q) ||
      toko.layanan.some((l) => l.toLowerCase().includes(q)) ||
      (toko.city?.toLowerCase().includes(q) ?? false)
    const matchesCity = selectedCity === 'Semua Kota' || toko.city === selectedCity
    return matchesSearch && matchesCity
  })

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <PageHero
        sectionTabs={{ tabs: mitraTabs, layoutId: 'mitra-section-tab' }}
        badge={{ icon: ShoppingBag, label: 'Toko & service' }}
        title={
          <>
            Promosi toko handphone,
            <span className="block">
              <span className="gradient-text-static">terdekat</span> & terpercaya.
            </span>
          </>
        }
        description="Temukan toko handphone dan service terpercaya di kota Anda."
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className={cn(searchInputIconClass, 'left-4')} strokeWidth={2} aria-hidden />
              <Input
                type="text"
                placeholder="Cari toko atau layanan…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-11"
              />
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-11 rounded-xl border border-surface-200/70 bg-white/70 px-4 text-sm text-surface-700 shadow-soft-xs backdrop-blur-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400/40"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm font-medium text-surface-700">
            Menampilkan{' '}
            <span className="font-bold text-primary-600">{filteredToko.length}</span> toko
            {loading && <span className="text-surface-500"> (memuat…)</span>}
          </div>
        </div>
      </PageHero>

      <main className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 pb-20 sm:gap-4 lg:grid-cols-2 lg:pb-0">
          {filteredToko.map((toko) => {
            const badge = toko.badge ? badgeConfig[toko.badge] : null
            const BadgeIcon = badge?.icon
            const jam = toko.jamWeekdays ?? toko.jamWeekend ?? '—'
            const avatar = toko.profileImage ?? toko.coverImage ?? defaultCover

            return (
              <Link key={toko.id} href={`/toko/${toko.id}`}>
                <Card className="group h-full cursor-pointer overflow-hidden border border-surface-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-soft-lg">
                  <div className="flex gap-3 p-3 sm:p-4">
                    <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-surface-100 sm:h-32 sm:w-32">
                      <img
                        src={avatar}
                        alt={toko.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {badge && BadgeIcon && (
                        <div className="absolute left-1.5 top-1.5">
                          <Badge className={`${badge.color} px-1.5 py-0.5 text-[9px] shadow-sm`}>
                            <BadgeIcon className="mr-0.5 h-2.5 w-2.5" />
                            {badge.label}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="line-clamp-1 text-[14px] font-semibold text-ink transition-colors group-hover:text-primary-700">
                        {toko.name}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-surface-500">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {[toko.address, toko.city].filter(Boolean).join(', ') || '—'}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-ink">{toko.rating.toFixed(1)}</span>
                          <span className="text-surface-500">({toko.reviewCount})</span>
                        </span>
                        <span className="flex items-center gap-0.5 text-surface-500">
                          <ShoppingBag className="h-3 w-3 text-primary-600" />
                          <span className="font-semibold text-ink">
                            {toko.totalPenjualan.toLocaleString('id-ID')}
                          </span>
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {toko.layanan.slice(0, 3).map((layanan) => (
                          <span
                            key={layanan}
                            className="inline-flex items-center rounded-full border border-surface-200/70 bg-white/70 px-1.5 py-0.5 text-[9px] font-medium text-surface-700"
                          >
                            {layanan}
                          </span>
                        ))}
                        {toko.layanan.length > 3 && (
                          <span className="inline-flex items-center rounded-full bg-primary-50 px-1.5 py-0.5 text-[9px] font-semibold text-primary-700">
                            +{toko.layanan.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-1 text-[10px] text-surface-500">
                          <Clock className="h-3 w-3 text-primary-600" />
                          <span>{jam}</span>
                        </div>
                        <Button variant="primary" size="sm" className="h-7 px-3 text-[10px]">
                          Kunjungi
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {!loading && filteredToko.length === 0 && (
          <div className="py-16 pb-20 text-center lg:pb-16">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
              <Search className="h-8 w-8 text-surface-400" />
            </div>
            <p className="mb-1 text-lg font-medium text-surface-700">Tidak ada toko yang ditemukan</p>
            <p className="text-sm text-surface-500">
              Coba ubah filter atau kata kunci pencarian Anda
            </p>
          </div>
        )}
      </main>
      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
