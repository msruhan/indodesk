'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpCircle, Mail, MessageCircle } from 'lucide-react'

export default function AdminHelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Help & Support</h1>
        <p className="text-surface-400 mt-1">Bantuan dan dukungan untuk admin</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              FAQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Bagaimana cara approve produk?</h4>
                <p className="text-sm text-surface-400">Pergi ke halaman Approval dan klik tombol Approve pada produk yang ingin disetujui.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Bagaimana cara mengelola user?</h4>
                <p className="text-sm text-surface-400">Gunakan halaman Manajemen User untuk melihat, edit, atau hapus user.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Kontak Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Email Support</h4>
                <p className="text-sm text-surface-400">support@indoteknizi.com</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Telepon</h4>
                <p className="text-sm text-surface-400">0800-1234-5678</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

