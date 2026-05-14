'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Wallet, Plus, TrendingUp, TrendingDown, Download } from 'lucide-react'

const transactions = [
  { id: '1', type: 'income', description: 'Konsultasi Unlock - ORD-2024-001', amount: 50000, date: '2024-03-20', status: 'completed' },
  { id: '2', type: 'income', description: 'Remote Flashing - ORD-2024-002', amount: 150000, date: '2024-03-19', status: 'completed' },
  { id: '3', type: 'expense', description: 'Top Up Saldo', amount: -100000, date: '2024-03-18', status: 'completed' },
  { id: '4', type: 'income', description: 'Root & Custom ROM - ORD-2024-003', amount: 200000, date: '2024-03-17', status: 'completed' },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

export default function TeknisiSaldoPage() {
  const saldo = 2500000

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Saldo & Transaksi</h1>
        <p className="text-surface-400 mt-1">Kelola saldo dan riwayat transaksi</p>
      </div>

      {/* Saldo Card */}
      <Card className="bg-gradient-to-r from-primary-600 to-accent-500 text-white">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Saldo Tersedia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-4">{formatPrice(saldo)}</div>
          <div className="flex gap-2">
            <Button variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Top Up Saldo
            </Button>
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30">
              <Download className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rp 5.450.000</div>
            <p className="text-xs text-surface-500">Bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Rp 2.950.000</div>
            <p className="text-xs text-surface-500">Bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <Wallet className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-surface-500">Bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>
                    <Badge variant={t.type === 'income' ? 'default' : 'secondary'}>
                      {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </Badge>
                  </TableCell>
                  <TableCell className={t.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {t.type === 'income' ? '+' : ''}{formatPrice(Math.abs(t.amount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{t.status}</Badge>
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

