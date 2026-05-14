'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Edit, Trash2, Briefcase, MapPin } from '@/lib/icons'

const lowongan = [
  { 
    id: '1', 
    title: 'Teknisi Handphone Senior', 
    company: 'HandPhone Center Jakarta',
    location: 'Jakarta',
    type: 'Full-time',
    applicants: 12,
    status: 'active',
    postedDate: '2024-03-15'
  },
  { 
    id: '2', 
    title: 'Teknisi Laptop & Handphone', 
    company: 'TechSolution Store',
    location: 'Bandung',
    type: 'Full-time',
    applicants: 8,
    status: 'active',
    postedDate: '2024-03-18'
  },
  { 
    id: '3', 
    title: 'Freelance Teknisi Remote', 
    company: 'Mobile Repair Online',
    location: 'Remote',
    type: 'Part-time',
    applicants: 25,
    status: 'active',
    postedDate: '2024-03-20'
  },
]

export default function AdminLowonganPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLowongan = lowongan.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Manajemen Lowongan Kerja</h1>
          <p className="text-sm text-surface-500 mt-1">Kelola lowongan kerja teknisi di platform</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Lowongan
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <Input
              placeholder="Cari lowongan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lowongan Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Lowongan ({filteredLowongan.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Perusahaan</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLowongan.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell>{l.company}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-surface-400" />
                      {l.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{l.type}</Badge>
                  </TableCell>
                  <TableCell>{l.applicants}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === 'active' ? 'default' : 'outline'}>
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{l.postedDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
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

