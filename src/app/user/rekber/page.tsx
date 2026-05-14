'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react'

const rekber = [
  { 
    id: '1', 
    orderId: 'ORD-2024-001', 
    seller: 'TechSolution Store',
    amount: 5000000, 
    status: 'in-progress', 
    createdAt: '2 hari lalu',
    description: 'Pembelian iPhone 13 Pro Max'
  },
  { 
    id: '2', 
    orderId: 'ORD-2024-002', 
    seller: 'HandPhone Center',
    amount: 2500000, 
    status: 'completed', 
    createdAt: '1 minggu lalu',
    description: 'Pembelian Samsung S21'
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

export default function UserRekberPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Rekber Saya</h1>
          <p className="text-surface-400 mt-1">Transaksi aman dengan rekening bersama</p>
        </div>
        <Button onClick={() => window.location.href = '/rekber'}>
          <Plus className="w-4 h-4 mr-2" />
          Ajukan Rekber Baru
        </Button>
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

      {/* Rekber List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Rekber</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rekber.map((r) => {
              const status = statusConfig[r.status as keyof typeof statusConfig]
              const StatusIcon = status.icon
              return (
                <div key={r.id} className="flex items-center justify-between p-4 border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{r.orderId}</h3>
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-surface-400 mb-1">{r.description}</p>
                    <div className="flex items-center gap-4 text-sm text-surface-500">
                      <span>Seller: {r.seller}</span>
                      <span>•</span>
                      <span className="font-semibold text-white">{formatPrice(r.amount)}</span>
                      <span>•</span>
                      <span>{r.createdAt}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button variant="outline">Detail</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

