'use client'

import {
  ConversionFunnelChart,
  DashboardPageHeader,
  DashboardPanel,
  EmptyState,
  InsightCard,
  KonsultasiChart,
  MetricCard,
  StatusBadge,
  TopProductsChart,
  TransaksiChart,
} from '@/components/dashboard'
import { ChartSlider } from '@/components/dashboard/chart-slider'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  Clock,
  MessageCircle,
  Shield,
  ShoppingBag,
  UserCheck,
  Users,
} from '@/lib/icons'

export default function AdminDashboardPage() {
  // Mock data - in production, fetch from API
  const stats = {
    totalUsers: 1245,
    totalTeknisi: 234,
    totalTransaksi: 5678,
    totalKonsultasi: 3456,
  }

  const recentOrders = [
    { id: '1', orderId: 'ORD-2024-001', user: 'Budi Santoso', amount: 5000000, status: 'completed', date: '2 hari lalu' },
    { id: '2', orderId: 'ORD-2024-002', user: 'Siti Nurhaliza', amount: 2500000, status: 'pending', date: '1 hari lalu' },
    { id: '3', orderId: 'ORD-2024-003', user: 'Rudi Hartono', amount: 800000, status: 'completed', date: '3 hari lalu' },
    { id: '4', orderId: 'ORD-2024-004', user: 'Dewi Lestari', amount: 3500000, status: 'in-progress', date: '5 jam lalu' },
  ]

  const operationalInsights = [
    {
      title: 'Approval SLA aman',
      description: '3 item menunggu review, tertua 5 jam. Prioritaskan toko dan teknisi baru sebelum jam operasional ramai.',
      icon: Clock,
      tone: 'primary' as const,
    },
    {
      title: 'Pantau rekber bernilai tinggi',
      description: 'Tambahkan queue khusus untuk transaksi escrow di atas Rp 3 juta dan status dispute.',
      icon: Shield,
      tone: 'warning' as const,
    },
    {
      title: 'Traffic konsultasi naik',
      description: 'Konsultasi tumbuh 15.7%. Gunakan insight ini untuk mendorong teknisi aktif menjaga response time.',
      icon: MessageCircle,
      tone: 'primary' as const,
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
      <DashboardPageHeader
        eyebrow="Command center"
        title="Dashboard Admin"
        description="Overview operasional platform, performa transaksi, approval, dan aktivitas ekosistem teknisi handphone."
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 font-medium text-primary-700">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Data live
            </span>
            <span>Terakhir diperbarui 2 menit lalu</span>
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {operationalInsights.map((item) => (
          <InsightCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total User"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={{ value: '+12.5%', label: 'vs bulan lalu', direction: 'up' }}
          sparkline={[42, 48, 46, 55, 58, 66, 72]}
          footnote="Aktif, teknisi, dan buyer"
        />
        <MetricCard
          title="Total Teknisi"
          value={stats.totalTeknisi.toLocaleString()}
          icon={UserCheck}
          trend={{ value: '+8.2%', label: 'vs bulan lalu', direction: 'up' }}
          sparkline={[21, 23, 22, 25, 27, 28, 31]}
          footnote="Verified dan pending review"
        />
        <MetricCard
          title="Total Transaksi"
          value={stats.totalTransaksi.toLocaleString()}
          icon={ShoppingBag}
          trend={{ value: '+23.1%', label: 'vs bulan lalu', direction: 'up' }}
          sparkline={[64, 70, 74, 78, 86, 93, 104]}
          footnote="Marketplace, topup, rekber"
        />
        <MetricCard
          title="Total Konsultasi"
          value={stats.totalKonsultasi.toLocaleString()}
          icon={MessageCircle}
          trend={{ value: '+15.7%', label: 'vs bulan lalu', direction: 'up' }}
          sparkline={[37, 39, 46, 44, 51, 58, 63]}
          footnote="Chat, remote, dan service"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ChartSlider>
          <TransaksiChart />
          <KonsultasiChart />
        </ChartSlider>

        <DashboardPanel
          title="Risk & Attention"
          description="Item yang perlu dipantau hari ini."
        >
          <div className="space-y-3">
            <InsightCard
              icon={AlertCircle}
              title="2 transaksi perlu validasi"
              description="Nominal tinggi dan deskripsi tidak lengkap. Perlu audit sebelum release dana."
              tone="danger"
            />
            <InsightCard
              icon={UserCheck}
              title="5 teknisi baru siap review"
              description="Pastikan KYC, spesialisasi, dan tarif konsultasi sudah lengkap."
              tone="primary"
            />
            <InsightCard
              icon={ShoppingBag}
              title="Produk topup naik 23%"
              description="Pertimbangkan flash sale dan auto-monitor stok denom populer."
              tone="neutral"
            />
          </div>
        </DashboardPanel>
      </div>

      {/* Second chart row: Funnel + Top Products */}
      <ChartSlider>
        <ConversionFunnelChart />
        <TopProductsChart />
      </ChartSlider>

      <div className="grid gap-6 lg:grid-cols-1">
        <DashboardPanel
          title="Order Terbaru"
          description="Transaksi terbaru lintas marketplace dan layanan."
          action={<Button variant="outline" size="sm">Lihat semua</Button>}
        >
          {recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderId}</TableCell>
                    <TableCell>{order.user}</TableCell>
                  <TableCell>{formatPrice(order.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status as 'completed' | 'pending' | 'in-progress'} />
                  </TableCell>
                  <TableCell className="text-surface-500 text-sm">{order.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="Belum ada order"
              description="Order baru akan tampil di sini setelah transaksi pertama masuk."
            />
          )}
        </DashboardPanel>
      </div>
    </div>
  )
}
