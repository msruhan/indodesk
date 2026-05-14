'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MessageCircle, Clock, CheckCircle, Star } from '@/lib/icons'

const konsultasi = [
  { 
    id: '1', 
    teknisi: 'Ahmad Hidayat', 
    service: 'Konsultasi Unlock', 
    status: 'completed', 
    date: '2024-03-17',
    rating: 5,
    price: 50000
  },
  { 
    id: '2', 
    teknisi: 'Budi Santoso', 
    service: 'Remote Flashing', 
    status: 'in-progress', 
    date: '2024-03-20',
    rating: null,
    price: 150000
  },
  { 
    id: '3', 
    teknisi: 'Siti Nurhaliza', 
    service: 'Troubleshooting', 
    status: 'completed', 
    date: '2024-03-10',
    rating: 4,
    price: 100000
  },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

export default function UserKonsultasiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Konsultasi</h1>
        <p className="text-sm text-surface-500 mt-1">Riwayat konsultasi dengan teknisi</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Konsultasi</CardTitle>
            <MessageCircle className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{konsultasi.length}</div>
            <p className="text-xs text-surface-500">Semua waktu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{konsultasi.filter(k => k.status === 'in-progress').length}</div>
            <p className="text-xs text-surface-500">Sedang berjalan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{konsultasi.filter(k => k.status === 'completed').length}</div>
            <p className="text-xs text-surface-500">Selesai</p>
          </CardContent>
        </Card>
      </div>

      {/* Konsultasi Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Konsultasi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teknisi</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {konsultasi.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.teknisi}</TableCell>
                  <TableCell>{k.service}</TableCell>
                  <TableCell>{formatPrice(k.price)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        k.status === 'completed' ? 'default' : 
                        'outline'
                      }
                    >
                      {k.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {k.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{k.rating}</span>
                      </div>
                    ) : (
                      <span className="text-surface-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>{k.date}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {k.status === 'completed' && !k.rating && (
                        <Button size="sm" variant="outline">Beri Review</Button>
                      )}
                      <Button size="sm" variant="outline">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

