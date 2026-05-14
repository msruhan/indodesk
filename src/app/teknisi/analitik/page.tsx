'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransaksiChart, KonsultasiChart } from '@/components/dashboard'
import { TrendingUp, Eye, MessageCircle, Star } from 'lucide-react'

export default function TeknisiAnalitikPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analitik</h1>
        <p className="text-surface-400 mt-1">Analisis performa dan statistik</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total View Profil</CardTitle>
            <Eye className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              +12.5% bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Konsultasi</CardTitle>
            <MessageCircle className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">567</div>
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              +8.2% bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Rata-rata</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.9</div>
            <p className="text-xs text-surface-500">Dari 234 review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.9%</div>
            <p className="text-xs text-surface-500">View ke konsultasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <TransaksiChart />
        <KonsultasiChart />
      </div>
    </div>
  )
}

