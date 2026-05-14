'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Shield, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const rekber = [
  { 
    id: '1', 
    orderId: 'ORD-2024-001', 
    buyer: 'Budi Santoso',
    seller: 'TechSolution Store',
    amount: 5000000,
    status: 'in-progress',
    createdAt: '2 hari lalu',
    description: 'Pembelian iPhone 13 Pro Max'
  },
  { 
    id: '2', 
    orderId: 'ORD-2024-002', 
    buyer: 'Siti Nurhaliza',
    seller: 'HandPhone Center',
    amount: 2500000,
    status: 'completed',
    createdAt: '1 minggu lalu',
    description: 'Pembelian Samsung S21'
  },
  { 
    id: '3', 
    orderId: 'ORD-2024-003', 
    buyer: 'Rudi Hartono',
    seller: 'Mobile Repair Bandung',
    amount: 800000,
    status: 'pending',
    createdAt: '3 hari lalu',
    description: 'Service HP - Screen Replacement'
  },
  { 
    id: '4', 
    orderId: 'ORD-2024-004', 
    buyer: 'Dewi Lestari',
    seller: 'Phone Shop Surabaya',
    amount: 3500000,
    status: 'dispute',
    createdAt: '5 hari lalu',
    description: 'Pembelian MacBook Air'
  },
]

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Shield },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  dispute: { label: 'Dispute', color: 'bg-red-100 text-red-700', icon: AlertCircle },
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

export default function AdminRekberPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manajemen Rekber (Escrow)</h1>
        <p className="text-surface-400 mt-1">Kelola semua transaksi rekening bersama</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rekber</CardTitle>
            <Shield className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rekber.length}</div>
            <p className="text-xs text-surface-500">Semua waktu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rekber.filter(r => r.status === 'in-progress').length}</div>
            <p className="text-xs text-surface-500">Sedang diproses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rekber.filter(r => r.status === 'completed').length}</div>
            <p className="text-xs text-surface-500">Selesai</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispute</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rekber.filter(r => r.status === 'dispute').length}</div>
            <p className="text-xs text-surface-500">Memerlukan mediasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Rekber Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Rekber</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rekber.map((r) => {
                const status = statusConfig[r.status as keyof typeof statusConfig]
                const StatusIcon = status.icon
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.orderId}</TableCell>
                    <TableCell>{r.buyer}</TableCell>
                    <TableCell>{r.seller}</TableCell>
                    <TableCell>{formatPrice(r.amount)}</TableCell>
                    <TableCell>{r.description}</TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.createdAt}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">Detail</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

