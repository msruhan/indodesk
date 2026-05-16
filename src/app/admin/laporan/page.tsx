'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TransaksiChart,
  KonsultasiChart,
  ConversionFunnelChart,
  TopProductsChart,
  MetricCard,
} from '@/components/dashboard'
import { ChartSlider } from '@/components/dashboard/chart-slider'
import {
  Calendar,
  DollarSign,
  Download,
  MessageCircle,
  ShoppingBag,
  TrendingUp,
  Users,
} from '@/lib/icons'

export default function AdminLaporanPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Laporan</h1>
          <p className="mt-0.5 text-[13px] text-surface-500">Analitik dan laporan platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <Calendar className="h-3.5 w-3.5" />
            Periode
          </Button>
          <Button variant="primary" size="sm" className="h-9">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Compact stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard title="Revenue" value="Rp 2.45M" icon={DollarSign} footnote="Bulan ini" tone="primary" compact />
        <MetricCard title="Users" value="1,245" icon={Users} footnote="Aktif" tone="primary" compact />
        <MetricCard title="Transaksi" value="5,678" icon={ShoppingBag} footnote="Bulan ini" tone="primary" compact />
        <MetricCard title="Konsultasi" value="3,456" icon={MessageCircle} footnote="Bulan ini" tone="primary" compact />
      </div>

      {/* Charts — slider */}
      <ChartSlider>
        <TransaksiChart />
        <KonsultasiChart />
        <ConversionFunnelChart />
        <TopProductsChart />
      </ChartSlider>

      {/* Quick insights */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Conversion Rate', value: '6.7%', delta: '+0.8%', desc: 'Dari view ke order' },
          { label: 'Avg Order Value', value: 'Rp 1.2jt', delta: '+12%', desc: 'Per transaksi' },
          { label: 'Repeat Buyer', value: '34%', delta: '+5%', desc: 'Beli lebih dari 1x' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-surface-200/70 bg-white p-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-surface-500">{item.label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold text-ink tabular-nums">{item.value}</span>
              <Badge variant="primary" className="text-[9px] px-1.5 py-0">
                <TrendingUp className="h-2.5 w-2.5" />
                {item.delta}
              </Badge>
            </div>
            <p className="mt-0.5 text-[10px] text-surface-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
