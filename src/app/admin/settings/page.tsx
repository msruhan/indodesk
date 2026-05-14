'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-surface-400 mt-1">Pengaturan admin platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Nama Platform</label>
                <Input defaultValue="IndoTeknizi" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Email Admin</label>
                <Input type="email" defaultValue="admin@indoteknizi.com" />
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

