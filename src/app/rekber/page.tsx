'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/landing'
import { BottomNav } from '@/components/mobile'
import { 
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react'

type RekberStatus = 'pending' | 'in-progress' | 'completed' | 'dispute'

interface Rekber {
  id: string
  orderId: string
  buyer: string
  seller: string
  amount: number
  status: RekberStatus
  createdAt: string
  description: string
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  dispute: { label: 'Dispute', color: 'bg-red-100 text-red-700', icon: AlertCircle },
}

export default function RekberPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Mock data - in production, fetch from API
  const rekberList: Rekber[] = [
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-surface-50 py-8">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Jasa Rekber (Escrow)</h1>
            <p className="text-surface-400">Transaksi aman dengan sistem rekening bersama</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-primary-600 to-accent-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajukan Rekber Baru
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Ajukan Jasa Rekber</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">
                      Order ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-surface-200 rounded-lg"
                      placeholder="ORD-2024-XXX"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">
                      Jumlah (Rp)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-surface-200 rounded-lg"
                      placeholder="5000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1 block">
                    Deskripsi Transaksi
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-surface-200 rounded-lg resize-none"
                    rows={3}
                    placeholder="Jelaskan transaksi yang ingin dilakukan..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-gradient-to-r from-primary-600 to-accent-500">
                    Submit
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Bagaimana Rekber Bekerja?</h3>
                <ul className="space-y-1 text-surface-700 text-sm">
                  <li>1. Buyer dan Seller setuju untuk menggunakan jasa rekber</li>
                  <li>2. Buyer mentransfer dana ke rekening rekber (ditahan)</li>
                  <li>3. Seller mengirim barang/melakukan service sesuai kesepakatan</li>
                  <li>4. Buyer konfirmasi setelah menerima barang/service</li>
                  <li>5. Admin melepaskan dana ke Seller</li>
                  <li>6. Jika ada dispute, Admin akan menjadi mediator</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rekber List */}
        <div className="space-y-4">
          {rekberList.map((rekber) => {
            const StatusIcon = statusConfig[rekber.status].icon
            return (
              <Card key={rekber.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">Order: {rekber.orderId}</h3>
                        <Badge className={statusConfig[rekber.status].color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[rekber.status].label}
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-surface-400">Buyer</div>
                          <div className="font-medium">{rekber.buyer}</div>
                        </div>
                        <div>
                          <div className="text-sm text-surface-400">Seller</div>
                          <div className="font-medium">{rekber.seller}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-surface-400">Deskripsi</div>
                        <div className="font-medium">{rekber.description}</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-surface-400">Jumlah</div>
                          <div className="text-xl font-bold text-primary-600">
                            {formatPrice(rekber.amount)}
                          </div>
                        </div>
                        <div className="text-sm text-surface-500">
                          Dibuat {rekber.createdAt}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        Detail
                      </Button>
                      {rekber.status === 'in-progress' && (
                        <Button variant="outline" size="sm">
                          Konfirmasi
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {rekberList.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 text-surface-300 mx-auto mb-4" />
              <p className="text-surface-500">Belum ada transaksi rekber</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

