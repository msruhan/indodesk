'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Eye, 
  MessageCircle, 
  Star, 
  Wallet,
  TrendingUp,
  Award
} from '@/lib/icons'
import { TransaksiChart } from '@/components/dashboard'

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Dashboard Teknisi</h1>
          <p className="mt-1 text-sm text-surface-500">Kelola profil dan layanan Anda</p>
        </div>
        <Button variant="primary">Top Up Saldo</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total View Profil</CardTitle>
            <Eye className="h-4 w-4 text-surface-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalView.toLocaleString()}</div>
            <p className="text-xs text-surface-500">+12.5% dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Konsultasi</CardTitle>
            <MessageCircle className="h-4 w-4 text-surface-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKonsultasi}</div>
            <p className="text-xs text-surface-500">+8.2% dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {stats.rating}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-surface-500">Dari 234 review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-surface-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.saldo)}</div>
            <p className="text-xs text-surface-500">Saldo tersedia</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Performa Konsultasi</CardTitle>
        </CardHeader>
        <CardContent>
          <TransaksiChart />
        </CardContent>
      </Card>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <Badge 
                      variant={
                        order.status === 'completed' ? 'default' : 
                        order.status === 'pending' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-surface-500">{order.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Badge & Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Badge & Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <Award className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="font-semibold">Top Teknisi</div>
                <div className="text-sm text-surface-500">Berdasarkan rating & konsultasi</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-green-200 rounded-lg bg-green-50">
              <Award className="w-8 h-8 text-green-600" />
              <div>
                <div className="font-semibold">Verified</div>
                <div className="text-sm text-surface-500">Teknisi terverifikasi</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

