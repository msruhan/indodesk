'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DashboardPageHeader,
  DashboardPanel,
  MetricCard,
  TeknisiEarningsChart,
  TeknisiServiceChart,
} from '@/components/dashboard'
import { TeknisiAnalitikStoreSection } from '@/components/teknisi/teknisi-analitik-store-section'
import { TeknisiProductAnalytics } from '@/components/teknisi/teknisi-product-analytics'
import { Eye, MessageCircle, Star, TrendingUp } from '@/lib/icons'
import type { TeknisiDashboardDto } from '@/lib/teknisi-dashboard-data'
import type { TeknisiStoreDto } from '@/lib/teknisi-store-serializer'

export default function TeknisiAnalitikPage() {
  const [data, setData] = useState<TeknisiDashboardDto | null>(null)
  const [store, setStore] = useState<TeknisiStoreDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboardRes, storeRes] = await Promise.all([
        fetch('/api/teknisi/dashboard'),
        fetch('/api/teknisi/toko'),
      ])
      const [dashboardJson, storeJson] = await Promise.all([
        dashboardRes.json(),
        storeRes.json(),
      ])

      if (!dashboardRes.ok || !dashboardJson.success) {
        setError(dashboardJson.error ?? 'Gagal memuat analitik')
        return
      }

      setData(dashboardJson.data)
      if (storeJson.success) setStore(storeJson.data ?? null)
    } catch {
      setError('Gagal memuat analitik')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className="py-16 text-center text-sm text-surface-500">Memuat analitik…</p>
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm text-rose-700">{error ?? 'Data tidak tersedia'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
          Coba lagi
        </Button>
      </div>
    )
  }

  const { profile, serviceMix, earningsWeekly, earningsWowPercent } = data
  const conversionRate =
    profile.totalView > 0
      ? ((profile.totalKonsultasi / profile.totalView) * 100).toFixed(1)
      : '0'

  const earningsChartData = {
    weeks: earningsWeekly.map((w) => w.week),
    earnings: earningsWeekly.map((w) => Math.round(w.earnings / 1000)),
    consultations: earningsWeekly.map((w) => w.consultations),
    remote: earningsWeekly.map((w) => w.remote),
    wowPercent: earningsWowPercent,
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Analitik"
        description="Analisis performa dan statistik dari data akun Anda"
      />

      <DashboardPanel
        title="Performa Profil Teknisi"
        description="Statistik profil publik, konsultasi, dan konversi."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total View Profil"
            value={profile.totalView.toLocaleString('id-ID')}
            footnote="Dari profil publik"
            icon={Eye}
            tone="primary"
            compact
          />
          <MetricCard
            title="Total Konsultasi"
            value={profile.totalKonsultasi.toLocaleString('id-ID')}
            footnote="Semua sesi selesai & aktif"
            icon={MessageCircle}
            tone="primary"
            compact
          />
          <MetricCard
            title="Rating Rata-rata"
            value={profile.rating > 0 ? profile.rating.toFixed(1) : '—'}
            footnote={`Dari ${profile.reviewCount} review`}
            icon={Star}
            tone="warning"
            compact
          />
          <MetricCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            footnote="View ke konsultasi"
            icon={TrendingUp}
            tone="primary"
            compact
          />
        </div>
      </DashboardPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <TeknisiEarningsChart data={earningsChartData} />
        <TeknisiServiceChart data={serviceMix.length > 0 ? serviceMix : undefined} />
      </div>

      <TeknisiProductAnalytics />

      <TeknisiAnalitikStoreSection store={store} />
    </div>
  )
}
