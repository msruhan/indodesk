'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function UserSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Pengaturan</h1>
        <p className="text-sm text-surface-500 mt-1">Pengaturan akun pengguna</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Nama</label>
                <Input defaultValue="User" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Email</label>
                <Input type="email" defaultValue="user@indoteknizi.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">No. Telepon</label>
                <Input defaultValue="081234567890" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Password Baru</label>
                <Input type="password" placeholder="••••••••" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button>Simpan Perubahan</Button>
              <Button variant="outline">Batal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

