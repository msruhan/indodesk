'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingBag, MessageCircle, Shield } from '@/lib/icons'

const orderHistory = [
  { id: '1', orderId: 'ORD-2024-001', item: 'iPhone 13 Pro Max', teknisi: 'TechSolution Store', amount: 5000000, status: 'completed', date: '2024-03-18' },
  { id: '2', orderId: 'ORD-2024-002', item: 'Samsung S21', teknisi: 'HandPhone Center', amount: 2500000, status: 'completed', date: '2024-03-15' },
]

const konsultasiHistory = [
  { id: '1', teknisi: 'Ahmad Hidayat', service: 'Konsultasi Unlock', status: 'completed', date: '2024-03-17', rating: 5 },
  { id: '2', teknisi: 'Siti Nurhaliza', service: 'Troubleshooting', status: 'completed', date: '2024-03-10', rating: 4 },
]

const rekberHistory = [
  { id: '1', orderId: 'ORD-2024-002', seller: 'HandPhone Center', amount: 2500000, status: 'completed', date: '2024-03-15' },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

export default function UserHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Riwayat</h1>
        <p className="text-sm text-surface-500 mt-1">Lihat semua riwayat transaksi Anda</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Order
              </TabsTrigger>
              <TabsTrigger value="konsultasi">
                <MessageCircle className="w-4 h-4 mr-2" />
                Konsultasi
              </TabsTrigger>
              <TabsTrigger value="rekber">
                <Shield className="w-4 h-4 mr-2" />
                Rekber
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="mt-6">
              <div className="space-y-4">
                {orderHistory.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-surface-200 rounded-lg">
                    <div>
                      <div className="font-semibold">{order.orderId}</div>
                      <div className="text-sm text-surface-500">{order.item}</div>
                      <div className="text-xs text-surface-500 mt-1">{order.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPrice(order.amount)}</div>
                      <Badge variant="default" className="mt-1">{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="konsultasi" className="mt-6">
              <div className="space-y-4">
                {konsultasiHistory.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-4 border border-surface-200 rounded-lg">
                    <div>
                      <div className="font-semibold">{k.teknisi}</div>
                      <div className="text-sm text-surface-500">{k.service}</div>
                      <div className="text-xs text-surface-500 mt-1">{k.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <span className="font-semibold">{k.rating}</span>
                        <span className="text-yellow-400">★</span>
                      </div>
                      <Badge variant="default">{k.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="rekber" className="mt-6">
              <div className="space-y-4">
                {rekberHistory.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 border border-surface-200 rounded-lg">
                    <div>
                      <div className="font-semibold">{r.orderId}</div>
                      <div className="text-sm text-surface-500">{r.seller}</div>
                      <div className="text-xs text-surface-500 mt-1">{r.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPrice(r.amount)}</div>
                      <Badge variant="default" className="mt-1">{r.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

