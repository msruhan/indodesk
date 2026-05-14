'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Edit, Trash2, CheckCircle, XCircle, Star } from 'lucide-react'
import Link from 'next/link'

const teknisi = [
  { 
    id: '1', 
    name: 'Ahmad Hidayat', 
    email: 'ahmad@example.com', 
    rating: 4.9, 
    totalKonsultasi: 567,
    badge: 'Top Teknisi',
    status: 'verified',
    joinDate: '2024-01-08'
  },
  { 
    id: '2', 
    name: 'Budi Santoso', 
    email: 'budi.tek@example.com', 
    rating: 4.7, 
    totalKonsultasi: 234,
    badge: 'Verified',
    status: 'verified',
    joinDate: '2024-02-15'
  },
  { 
    id: '3', 
    name: 'Rudi Hartono', 
    email: 'rudi.tek@example.com', 
    rating: 4.5, 
    totalKonsultasi: 123,
    badge: 'Newbie',
    status: 'pending',
    joinDate: '2024-03-10'
  },
]

export default function AdminTeknisiPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTeknisi = teknisi.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Teknisi</h1>
          <p className="text-surface-400 mt-1">Kelola dan verifikasi teknisi di platform</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <Input
              placeholder="Cari teknisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teknisi Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Teknisi ({filteredTeknisi.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Total Konsultasi</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeknisi.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {t.rating}
                    </div>
                  </TableCell>
                  <TableCell>{t.totalKonsultasi}</TableCell>
                  <TableCell>
                    <Badge variant={t.badge === 'Top Teknisi' ? 'default' : 'secondary'}>
                      {t.badge}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t.status === 'verified' ? (
                      <Badge className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <XCircle className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{t.joinDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/teknisi/${t.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
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

