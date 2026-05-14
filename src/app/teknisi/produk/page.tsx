'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Edit, Trash2, Eye } from '@/lib/icons'
import Link from 'next/link'

const produk = [
  { 
    id: '1', 
    name: 'iPhone 13 Pro Max - Second', 
    category: 'Handphone',
    price: 8500000,
    status: 'approved',
    views: 2341,
    createdAt: '2024-03-15'
  },
  { 
    id: '2', 
    name: 'Samsung S21 Ultra - Refurbished', 
    category: 'Handphone',
    price: 5200000,
    status: 'approved',
    views: 1890,
    createdAt: '2024-03-14'
  },
  { 
    id: '3', 
    name: 'Unlock Tool Premium License', 
    category: 'Software',
    price: 500000,
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

export default function TeknisiProdukPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const filteredProduk = produk.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Produk & Software</h1>
          <p className="text-sm text-surface-500 mt-1">Kelola produk dan software yang Anda jual</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Produk Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1 block">Nama Produk</label>
                  <Input placeholder="Contoh: iPhone 13 Pro Max" />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1 block">Kategori</label>
                  <select className="w-full px-3 py-2 border border-surface-200 rounded-lg">
                    <option>Handphone</option>
                    <option>Laptop</option>
                    <option>Aksesoris</option>
                    <option>Software</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1 block">Harga (Rp)</label>
                  <Input type="number" placeholder="8500000" />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1 block">Foto Produk</label>
                  <Input type="file" accept="image/*" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Deskripsi</label>
                <textarea 
                  className="w-full px-3 py-2 border border-surface-200 rounded-lg resize-none"
                  rows={4}
                  placeholder="Deskripsi lengkap produk..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Simpan</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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

