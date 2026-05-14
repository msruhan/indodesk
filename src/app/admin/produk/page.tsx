'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

const produk = [
  { 
    id: '1', 
    name: 'iPhone 13 Pro Max - Second', 
    category: 'Handphone',
    price: 8500000,
    teknisi: 'TechSolution',
    status: 'approved',
    views: 2341,
    createdAt: '2024-03-15'
  },
  { 
    id: '2', 
    name: 'Samsung S21 Ultra - Refurbished', 
    category: 'Handphone',
    price: 5200000,
    teknisi: 'HandPhone Center',
    status: 'approved',
    views: 1890,
    createdAt: '2024-03-14'
  },
  { 
    id: '3', 
    name: 'Unlock Tool Premium License', 
    category: 'Software',
    price: 500000,
    teknisi: 'TechSolution',
    status: 'pending',
    views: 0,
    createdAt: '2024-03-20'
  },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

export default function AdminProdukPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredProduk = produk.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Produk</h1>
          <p className="text-surface-400 mt-1">Kelola produk dan software yang dijual di marketplace</p>
        </div>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-surface-200 rounded-lg"
            >
              <option value="all">Semua Kategori</option>
              <option value="handphone">Handphone</option>
              <option value="laptop">Laptop</option>
              <option value="aksesoris">Aksesoris</option>
              <option value="software">Software</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Produk Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk ({filteredProduk.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Teknisi/Toko</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProduk.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.category}</Badge>
                  </TableCell>
                  <TableCell>{formatPrice(p.price)}</TableCell>
                  <TableCell>{p.teknisi}</TableCell>
                  <TableCell>{p.views.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'approved' ? 'default' : 'secondary'}>
                      {p.status === 'approved' ? 'Approved' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/marketplace/${p.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
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

