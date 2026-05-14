'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpCircle, Mail, MessageCircle } from 'lucide-react'

export default function UserHelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Help & Support</h1>
        <p className="text-surface-400 mt-1">Bantuan dan dukungan untuk user</p>
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
                <h4 className="font-semibold mb-2">Bagaimana cara melakukan konsultasi?</h4>
                <p className="text-sm text-surface-400">Pilih teknisi di halaman Teknisi, kemudian klik tombol Konsultasi Online.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Bagaimana cara menggunakan rekber?</h4>
                <p className="text-sm text-surface-400">Pergi ke halaman Rekber dan klik Ajukan Rekber Baru untuk memulai transaksi aman.</p>
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

