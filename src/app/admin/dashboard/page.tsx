'use client'

import { TransaksiChart, KonsultasiChart } from '@/components/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, UserCheck, ShoppingBag, MessageCircle, X, CheckCircle, TrendingUp } from 'lucide-react'

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

  const pendingApprovals = [
    { id: '1', type: 'Produk', name: 'iPhone 13 Pro Max', submitter: 'TechSolution Store', date: '1 jam lalu' },
    { id: '2', type: 'Teknisi', name: 'Ahmad Hidayat', submitter: 'Ahmad Hidayat', date: '3 jam lalu' },
    { id: '3', type: 'Toko', name: 'HandPhone Center Jakarta', submitter: 'HandPhone Center', date: '5 jam lalu' },
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
          <p className="text-surface-400 mt-1">Overview platform ekosistem teknisi handphone</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total User</CardTitle>
            <Users className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              +12.5% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teknisi</CardTitle>
            <UserCheck className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeknisi.toLocaleString()}</div>
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              +8.2% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransaksi.toLocaleString()}</div>
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              +23.1% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Konsultasi</CardTitle>
            <MessageCircle className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKonsultasi.toLocaleString()}</div>
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              +15.7% dari bulan lalu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <TransaksiChart />
        <KonsultasiChart />
      </div>

      {/* Tables Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Order Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <TableCell className="text-surface-500 text-sm">{order.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-surface-200 rounded-lg">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-surface-500">
                      {item.type} • {item.submitter}
                    </div>
                    <div className="text-xs text-surface-400 mt-1">{item.date}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

