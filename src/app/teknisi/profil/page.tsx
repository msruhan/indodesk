'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Star, Award, CheckCircle, Radio } from 'lucide-react'

export default function TeknisiProfilPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profil Teknisi</h1>
        <p className="text-surface-400 mt-1">Kelola profil dan informasi teknisi Anda</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold">
                AH
              </div>
              <div>
                <Button variant="outline">Ubah Foto</Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Nama Lengkap</label>
                <Input defaultValue="Ahmad Hidayat" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Email</label>
                <Input type="email" defaultValue="ahmad@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">No. Telepon</label>
                <Input defaultValue="081234567890" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Lokasi</label>
                <Input defaultValue="Jakarta Selatan" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Pengalaman</label>
                <Input defaultValue="8 tahun" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Harga Konsultasi (Rp)</label>
                <Input type="number" defaultValue="50000" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-surface-700 mb-1 block">Deskripsi</label>
              <textarea 
                className="w-full px-3 py-2 border border-surface-200 rounded-lg resize-none"
                rows={4}
                defaultValue="Teknisi handphone berpengalaman dengan spesialisasi unlock, flashing, dan root berbagai brand."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-surface-700 mb-1 block">Spesialisasi</label>
              <div className="flex flex-wrap gap-2">
                <Badge>Unlock</Badge>
                <Badge>Flashing</Badge>
                <Badge>Root</Badge>
                <Badge>Hardware Repair</Badge>
                <Button size="sm" variant="outline">+ Tambah</Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button>Simpan Perubahan</Button>
              <Button variant="outline">Batal</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Stats & Badge */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Statistik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-surface-400">Rating</span>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-lg">4.9</span>
                <span className="text-surface-500">(234 review)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-surface-400">Total Konsultasi</span>
              <span className="font-bold text-lg">567</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-surface-400">Total View Profil</span>
              <span className="font-bold text-lg">1,234</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badge & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <Award className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="font-semibold">Top Teknisi</div>
                <div className="text-sm text-surface-400">Berdasarkan rating & konsultasi</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-green-200 rounded-lg bg-green-50">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="font-semibold">Verified</div>
                <div className="text-sm text-surface-400">Teknisi terverifikasi</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <Radio className="w-8 h-8 text-blue-600" />
              <div>
                <div className="font-semibold">Online</div>
                <div className="text-sm text-surface-400">Sedang online sekarang</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sertifikasi */}
      <Card>
        <CardHeader>
          <CardTitle>Sertifikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-surface-200 rounded-lg">
              <div>
                <div className="font-semibold">Certified Mobile Technician</div>
                <div className="text-sm text-surface-400">Indonesia Mobile Tech • 2020</div>
              </div>
              <Button variant="outline" size="sm">Hapus</Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-surface-200 rounded-lg">
              <div>
                <div className="font-semibold">Advanced Flashing Specialist</div>
                <div className="text-sm text-surface-400">Tech Academy • 2021</div>
              </div>
              <Button variant="outline" size="sm">Hapus</Button>
            </div>
            <Button variant="outline">+ Tambah Sertifikasi</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

