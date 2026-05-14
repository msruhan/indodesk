'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ShoppingBag, 
  MessageCircle,
  Shield,
  Package
} from '@/lib/icons'

export default function UserDashboardPage() {
  // Mock data - in production, fetch from API
  const orderHistory = [
    { id: '1', orderId: 'ORD-2024-001', item: 'iPhone 13 Pro Max', teknisi: 'TechSolution Store', amount: 5000000, status: 'completed', date: '2 hari lalu' },
    { id: '2', orderId: 'ORD-2024-002', item: 'Samsung S21', teknisi: 'HandPhone Center', amount: 2500000, status: 'in-progress', date: '1 hari lalu' },
    { id: '3', orderId: 'ORD-2024-003', item: 'Konsultasi Unlock', teknisi: 'Ahmad Hidayat', amount: 50000, status: 'completed', date: '3 hari lalu' },
    { id: '4', orderId: 'ORD-2024-004', item: 'Remote Flashing', teknisi: 'Budi Santoso', amount: 150000, status: 'pending', date: '5 jam lalu' },
  ]

  const konsultasiHistory = [
    { id: '1', teknisi: 'Ahmad Hidayat', service: 'Konsultasi Unlock', status: 'completed', date: '3 hari lalu' },
    { id: '2', teknisi: 'Budi Santoso', service: 'Remote Flashing', status: 'in-progress', date: '1 hari lalu' },
    { id: '3', teknisi: 'Siti Nurhaliza', service: 'Troubleshooting', status: 'completed', date: '1 minggu lalu' },
  ]

  const rekberStatus = [
    { id: '1', orderId: 'ORD-2024-001', amount: 5000000, status: 'in-progress', date: '2 hari lalu' },
    { id: '2', orderId: 'ORD-2024-002', amount: 2500000, status: 'completed', date: '1 minggu lalu' },
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const stats = {
    totalOrder: orderHistory.length,
    totalKonsultasi: konsultasiHistory.length,
    rekberAktif: rekberStatus.filter(r => r.status === 'in-progress').length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Dashboard User</h1>
          <p className="mt-1 text-sm text-surface-500">Kelola order, konsultasi, dan transaksi Anda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => (window.location.href = '/marketplace')}>
            Marketplace
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/teknisi')}>
            Cari Teknisi
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Order</CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrder}</div>
            <p className="text-xs text-surface-500">Semua waktu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konsultasi</CardTitle>
            <MessageCircle className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKonsultasi}</div>
            <p className="text-xs text-surface-500">Aktif & selesai</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rekber Aktif</CardTitle>
            <Shield className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rekberAktif}</div>
            <p className="text-xs text-surface-500">Dalam proses</p>
          </CardContent>
        </Card>
      </div>

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
                <TableHead>Item/Service</TableHead>
                <TableHead>Teknisi/Toko</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderHistory.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderId}</TableCell>
                  <TableCell>{order.item}</TableCell>
                  <TableCell>{order.teknisi}</TableCell>
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

      {/* Konsultasi History */}
      <Card>
        <CardHeader>
          <CardTitle>Konsultasi History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teknisi</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {konsultasiHistory.map((konsultasi) => (
                <TableRow key={konsultasi.id}>
                  <TableCell className="font-medium">{konsultasi.teknisi}</TableCell>
                  <TableCell>{konsultasi.service}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        konsultasi.status === 'completed' ? 'default' : 
                        'outline'
                      }
                    >
                      {konsultasi.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-surface-500">{konsultasi.date}</TableCell>
                  <TableCell>
                    {konsultasi.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        Beri Review
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="ml-2">
                      Chat
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rekber Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status Rekber</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rekberStatus.map((rekber) => (
              <div key={rekber.id} className="flex items-center justify-between p-4 border border-surface-200 rounded-lg">
                <div>
                  <div className="font-medium">{rekber.orderId}</div>
                  <div className="text-sm text-surface-500">{formatPrice(rekber.amount)}</div>
                  <div className="text-xs text-sm text-surface-500 mt-1">{rekber.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={
                      rekber.status === 'completed' ? 'default' : 
                      'outline'
                    }
                  >
                    {rekber.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Detail
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

