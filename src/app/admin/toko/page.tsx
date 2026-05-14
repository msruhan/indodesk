'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Edit, Trash2, MapPin, Star } from '@/lib/icons'
import Link from 'next/link'

const toko = [
  { 
    id: '1', 
    name: 'HandPhone Center Jakarta', 
    owner: 'Ahmad Hidayat',
    location: 'Jakarta',
    rating: 4.8,
    totalPenjualan: 2341,
    status: 'approved',
    badge: 'Top Seller'
  },
  { 
    id: '2', 
    name: 'TechSolution Store', 
    owner: 'Budi Santoso',
    location: 'Bandung',
    rating: 4.9,
    totalPenjualan: 1567,
    status: 'approved',
    badge: 'Trusted Store'
  },
  { 
    id: '3', 
    name: 'Mobile Repair Surabaya', 
    owner: 'Rudi Hartono',
    location: 'Surabaya',
    rating: 4.6,
    totalPenjualan: 890,
    status: 'pending',
    badge: null
  },
]

export default function AdminTokoPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredToko = toko.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Manajemen Toko</h1>
          <p className="text-sm text-surface-500 mt-1">Kelola toko handphone dan service center</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <Input
              placeholder="Cari toko..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Toko Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Toko ({filteredToko.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Toko</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Total Penjualan</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredToko.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.owner}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-surface-400" />
                      {t.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {t.rating}
                    </div>
                  </TableCell>
                  <TableCell>{t.totalPenjualan.toLocaleString()}</TableCell>
                  <TableCell>
                    {t.badge ? (
                      <Badge variant="default">{t.badge}</Badge>
                    ) : (
                      <span className="text-surface-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'approved' ? 'default' : 'secondary'}>
                      {t.status === 'approved' ? 'Approved' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/toko/${t.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
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

