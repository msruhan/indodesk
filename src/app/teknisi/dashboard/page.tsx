'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  CheckCircle,
  Eye, 
  MessageCircle, 
  Star, 
  Wallet,
  Award,
  Clock,
  Laptop,
  Users,
} from '@/lib/icons'
import {
  DashboardPageHeader,
  DashboardPanel,
  EmptyState,
  InsightCard,
  MetricCard,
  StatusBadge,
  TeknisiEarningsChart,
  TeknisiServiceChart,
} from '@/components/dashboard'
import { ChartSlider } from '@/components/dashboard/chart-slider'
import { TeknisiWelcomeCard } from '@/components/teknisi/teknisi-welcome-card'

export default function TeknisiDashboardPage() {
  // Mock data - in production, fetch from API
  const stats = {
    totalView: 1234,
    totalKonsultasi: 567,
    rating: 4.9,
    saldo: 2500000,
  }

  const orderHistory = [
    { id: '1', orderId: 'ORD-2024-001', service: 'Konsultasi Unlock', user: 'Budi Santoso', amount: 50000, status: 'completed', date: '2 hari lalu' },
    { id: '2', orderId: 'ORD-2024-002', service: 'Remote Flashing', user: 'Siti Nurhaliza', amount: 150000, status: 'completed', date: '3 hari lalu' },
    { id: '3', orderId: 'ORD-2024-003', service: 'Root & Custom ROM', user: 'Rudi Hartono', amount: 200000, status: 'in-progress', date: '1 hari lalu' },
    { id: '4', orderId: 'ORD-2024-004', service: 'Troubleshooting Hardware', user: 'Dewi Lestari', amount: 100000, status: 'pending', date: '5 jam lalu' },
  ]

  const personalInsights = [
    {
      title: 'Response time bagus',
      description: 'Rata-rata balasan 4 menit. Pertahankan agar ranking konsultasi tetap tinggi.',
      icon: Clock,
      tone: 'primary' as const,
    },
    {
      title: 'Remote service berpotensi naik',
      description: '2 dari 4 request terakhir terkait flashing dan unlock. Tambahkan paket remote cepat.',
      icon: Laptop,
      tone: 'warning' as const,
    },
    {
      title: 'Profil dilihat 1.2k kali',
      description: 'Foto profil, sertifikasi, dan galeri kerja akan menaikkan konversi konsultasi.',
      icon: Users,
      tone: 'neutral' as const,
    },
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <TeknisiWelcomeCard name="Teknisi" />

      <DashboardPageHeader
        eyebrow="Technician workspace"
        title="Dashboard Teknisi"
        description="Pantau performa profil, konsultasi, saldo, dan order yang perlu ditindaklanjuti."
        actions={<Button variant="primary">Top Up Saldo</Button>}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 font-medium text-primary-700">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Online menerima konsultasi
            </span>
            <span>Rating stabil 4.9 dari 234 review</span>
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {personalInsights.map((item) => (
          <InsightCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total View Profil"
          value={stats.totalView.toLocaleString()}
          icon={Eye}
          trend={{ value: '+12.5%', label: 'vs bulan lalu', direction: 'up' }}
          sparkline={[22, 29, 31, 38, 41, 48, 57]}
          footnote="Profil dan listing layanan"
        />
        <MetricCard
          title="Total Konsultasi"
          value={stats.totalKonsultasi.toLocaleString()}
          icon={MessageCircle}
          trend={{ value: '+8.2%', label: 'vs bulan lalu', direction: 'up' }}
          sparkline={[18, 22, 25, 28, 27, 34, 36]}
          footnote="Chat, remote, dan follow-up"
        />
        <MetricCard
          title="Rating"
          value={`${stats.rating}`}
          icon={Star}
          trend={{ value: '234 review', label: 'aktif', direction: 'neutral' }}
          sparkline={[4.6, 4.7, 4.8, 4.85, 4.9, 4.88, 4.9]}
          footnote="Target minimal 4.8"
          tone="warning"
        />
        <MetricCard
          title="Saldo"
          value={formatPrice(stats.saldo)}
          icon={Wallet}
          trend={{ value: '+Rp 450rb', label: 'minggu ini', direction: 'up' }}
          sparkline={[18, 20, 25, 23, 28, 35, 42]}
          footnote="Saldo tersedia"
        />
      </div>

      <ChartSlider>
        <TeknisiEarningsChart />
        <TeknisiServiceChart />
      </ChartSlider>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardPanel title="Performa Bulan Ini" description="Ringkasan aktivitas & pencapaian layanan.">
          {/* Top stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="relative overflow-hidden rounded-xl border border-primary-200/60 bg-gradient-to-br from-primary-50/80 to-white p-3">
              <div className="aurora-blob pointer-events-none absolute -right-6 -top-6 h-16 w-16 opacity-40">
                <div className="h-full w-full rounded-full bg-primary-300 blur-xl" />
              </div>
              <MessageCircle className="mb-1.5 h-4 w-4 text-primary-600" />
              <p className="text-xl font-bold text-ink tabular-nums">30</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary-700">Konsultasi</p>
              <p className="mt-1 text-[10px] text-surface-500">+8 vs bulan lalu</p>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-accent-200/60 bg-gradient-to-br from-accent-50/80 to-white p-3">
              <div className="aurora-blob pointer-events-none absolute -right-6 -top-6 h-16 w-16 opacity-40">
                <div className="h-full w-full rounded-full bg-accent-300 blur-xl" />
              </div>
              <Laptop className="mb-1.5 h-4 w-4 text-accent-600" />
              <p className="text-xl font-bold text-ink tabular-nums">10</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-accent-700">Remote</p>
              <p className="mt-1 text-[10px] text-surface-500">+4 vs bulan lalu</p>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-white p-3">
              <div className="aurora-blob pointer-events-none absolute -right-6 -top-6 h-16 w-16 opacity-40">
                <div className="h-full w-full rounded-full bg-violet-300 blur-xl" />
              </div>
              <Award className="mb-1.5 h-4 w-4 text-violet-600" />
              <p className="text-xl font-bold text-ink tabular-nums">12</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-violet-700">Produk Terjual</p>
              <p className="mt-1 text-[10px] text-surface-500">+3 vs bulan lalu</p>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-white p-3">
              <div className="aurora-blob pointer-events-none absolute -right-6 -top-6 h-16 w-16 opacity-40">
                <div className="h-full w-full rounded-full bg-amber-300 blur-xl" />
              </div>
              <Star className="mb-1.5 h-4 w-4 text-amber-600" />
              <p className="text-xl font-bold text-ink tabular-nums">98%</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-700">Completion</p>
              <p className="mt-1 text-[10px] text-surface-500">Target: 95%</p>
            </div>
          </div>

          {/* Progress bars */}
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-medium text-surface-700">Response time rata-rata</span>
                <span className="font-semibold text-primary-700">4.2 menit</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-100">
                <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-primary-500 to-accent-500" />
              </div>
              <p className="mt-0.5 text-[10px] text-surface-500">Target &lt; 5 menit · Excellent</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-medium text-surface-700">Rating bulan ini</span>
                <span className="font-semibold text-amber-700">4.9 / 5.0</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-100">
                <div className="h-full w-[98%] rounded-full bg-gradient-to-r from-amber-400 to-amber-500" />
              </div>
              <p className="mt-0.5 text-[10px] text-surface-500">Dari 51 review · Top 5% teknisi</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-medium text-surface-700">Pendapatan vs target</span>
                <span className="font-semibold text-ink">Rp 1.92jt / 2.5jt</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-100">
                <div className="h-full w-[77%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              </div>
              <p className="mt-0.5 text-[10px] text-surface-500">77% tercapai · 8 hari tersisa</p>
            </div>
          </div>

          {/* Quick achievements */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary-200/70 bg-primary-50/60 px-2.5 py-1 text-[10px] font-medium text-primary-700">
              <CheckCircle className="h-3 w-3" /> Fast Responder
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/70 bg-amber-50/60 px-2.5 py-1 text-[10px] font-medium text-amber-700">
              <Star className="h-3 w-3" /> Top Rated
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200/70 bg-violet-50/60 px-2.5 py-1 text-[10px] font-medium text-violet-700">
              <Award className="h-3 w-3" /> 500+ Sesi
            </span>
          </div>
        </DashboardPanel>
        <DashboardPanel
          title="Next Best Action"
          description="Prioritas kerja yang paling berdampak."
        >
          <div className="space-y-3">
            <InsightCard
              icon={MessageCircle}
              title="Balas 1 konsultasi pending"
              description="Selesaikan sebelum 10 menit untuk menjaga SLA dan ranking."
              tone="warning"
            />
            <InsightCard
              icon={CheckCircle}
              title="Lengkapi sertifikasi"
              description="Upload bukti skill unlock/flashing agar badge verified lebih kuat."
              tone="primary"
            />
            <InsightCard
              icon={Wallet}
              title="Tarik saldo siap proses"
              description="Rp 2.500.000 tersedia. Pastikan rekening payout masih aktif."
              tone="neutral"
            />
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Order History"
        description="Riwayat order dan sesi yang perlu dipantau."
        action={<Button variant="outline" size="sm">Lihat semua</Button>}
      >
        {orderHistory.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderHistory.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderId}</TableCell>
                  <TableCell>{order.service}</TableCell>
                <TableCell>{order.user}</TableCell>
                <TableCell>{formatPrice(order.amount)}</TableCell>
                <TableCell>
                  <StatusBadge status={order.status as 'completed' | 'pending' | 'in-progress'} />
                </TableCell>
                <TableCell className="text-surface-500">{order.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="Belum ada order"
            description="Order konsultasi dan remote akan tampil di sini setelah pelanggan menghubungi Anda."
          />
        )}
      </DashboardPanel>

      <DashboardPanel
        title="Badge & Achievements"
        description="Status kepercayaan yang tampil ke pelanggan."
      >
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
              <Award className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  Top Teknisi
                  <Badge variant="warning">Aktif</Badge>
                </div>
                <div className="text-sm text-surface-500">Berdasarkan rating & konsultasi</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
              <Award className="w-8 h-8 text-green-600" />
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  Verified
                  <Badge variant="success">Terjaga</Badge>
                </div>
                <div className="text-sm text-surface-500">Teknisi terverifikasi</div>
              </div>
            </div>
          </div>
      </DashboardPanel>
    </div>
  )
}
