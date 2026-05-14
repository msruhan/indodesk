'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, MapPin, Clock, Star } from 'lucide-react'
import Link from 'next/link'

const toko = [
  { 
    id: '1', 
    name: 'HandPhone Center Jakarta', 
    location: 'Jl. Thamrin No. 123, Jakarta',
    city: 'Jakarta',
    rating: 4.8,
    totalPenjualan: 2341,
    status: 'approved',
    badge: 'Top Seller'
  },
]

export default function TeknisiTokoPage() {
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Toko HP</h1>
          <p className="text-surface-400 mt-1">Kelola informasi toko handphone Anda</p>
        </div>
        {toko.length === 0 && (
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Toko
          </Button>
        )}
      </div>

      {/* Add Toko Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Toko Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1 block">Nama Toko</label>
                  <Input placeholder="Contoh: HandPhone Center Jakarta" />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1 block">Kota</label>
                  <Input placeholder="Jakarta" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-surface-700 mb-1 block">Alamat Lengkap</label>
                  <Input placeholder="Jl. Thamrin No. 123" />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1 block">No. Telepon</label>
                  <Input placeholder="081234567890" />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1 block">Email</label>
                  <Input type="email" placeholder="info@tokohp.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1 block">Jam Operasional (Weekdays)</label>
                  <Input placeholder="09:00 - 21:00" />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1 block">Jam Operasional (Weekend)</label>
                  <Input placeholder="10:00 - 20:00" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Foto Toko</label>
                <Input type="file" accept="image/*" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Deskripsi Toko</label>
                <textarea 
                  className="w-full px-3 py-2 border border-surface-200 rounded-lg resize-none"
                  rows={4}
                  placeholder="Deskripsi toko dan layanan yang tersedia..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Layanan Tersedia</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge>Service HP</Badge>
                  <Badge>Jual Beli</Badge>
                  <Badge>Unlock</Badge>
                  <Button size="sm" variant="outline">+ Tambah Layanan</Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Simpan</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Toko List */}
      {toko.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Informasi Toko</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {toko.map((t) => (
                <div key={t.id}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{t.name}</h3>
                        {t.badge && (
                          <Badge variant="default">{t.badge}</Badge>
                        )}
                        <Badge variant={t.status === 'approved' ? 'default' : 'secondary'}>
                          {t.status === 'approved' ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-surface-400 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{t.location}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{t.rating}</span>
                        </div>
                        <span className="text-surface-400">{t.totalPenjualan.toLocaleString()} penjualan</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/toko/${t.id}`}>
                        <Button variant="outline">View</Button>
                      </Link>
                      <Button variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

