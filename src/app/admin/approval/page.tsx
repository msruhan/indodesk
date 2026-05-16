'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, Shield } from '@/lib/icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminApprovalRekberPanel } from '@/components/admin/admin-approval-rekber-panel'
import { cn } from '@/lib/utils'

const pendingApprovals = [
  { id: '1', type: 'Produk', name: 'Unlock Tool Premium License', submitter: 'TechSolution Store', date: '1 jam lalu', description: 'Software license untuk unlock berbagai brand handphone' },
  { id: '2', type: 'Teknisi', name: 'Rudi Hartono', submitter: 'Rudi Hartono', date: '3 jam lalu', description: 'Teknisi baru dengan spesialisasi hardware repair' },
  { id: '3', type: 'Toko', name: 'Mobile Repair Surabaya', submitter: 'Rudi Hartono', date: '5 jam lalu', description: 'Toko service handphone di Surabaya' },
  { id: '4', type: 'Produk', name: 'Xiaomi Redmi Note 12 Pro', submitter: 'HandPhone Center', date: '1 hari lalu', description: 'Handphone baru kondisi 95%' },
]

const typeBadge: Record<string, { variant: 'primary' | 'info' | 'warning'; label: string }> = {
  Produk: { variant: 'primary', label: 'Produk' },
  Teknisi: { variant: 'info', label: 'Teknisi' },
  Toko: { variant: 'warning', label: 'Toko' },
}

export default function AdminApprovalPage() {
  const [section, setSection] = useState('queue')
  const [items, setItems] = useState(pendingApprovals)

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Approval</h1>
        <p className="mt-0.5 text-[13px] text-surface-500">Review dan approve produk, teknisi, dan toko</p>
      </div>

      <Tabs value={section} onValueChange={setSection}>
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-10 w-max flex-nowrap gap-1">
            <TabsTrigger value="queue" className="shrink-0 px-3 text-xs sm:px-4">
              Permintaan approval
            </TabsTrigger>
            <TabsTrigger value="rekber" className="shrink-0 px-3 text-xs sm:px-4">
              Manajemen Escrow
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="queue" className="mt-4 space-y-4">
          {/* Compact stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3">
              <Clock className="mb-1 h-4 w-4 text-amber-600" />
              <p className="text-xl font-bold text-ink tabular-nums">{items.length}</p>
              <p className="text-[10px] font-medium text-surface-500">Pending</p>
            </div>
            <div className="rounded-xl border border-primary-200/60 bg-primary-50/40 p-3">
              <CheckCircle className="mb-1 h-4 w-4 text-primary-600" />
              <p className="text-xl font-bold text-ink tabular-nums">12</p>
              <p className="text-[10px] font-medium text-surface-500">Approved</p>
            </div>
            <div className="rounded-xl border border-rose-200/60 bg-rose-50/40 p-3">
              <XCircle className="mb-1 h-4 w-4 text-rose-600" />
              <p className="text-xl font-bold text-ink tabular-nums">2</p>
              <p className="text-[10px] font-medium text-surface-500">Rejected</p>
            </div>
          </div>

          {/* Approval list */}
          <div>
            <h2 className="mb-3 text-sm font-bold text-ink">
              Pending ({items.length})
            </h2>
            <AnimatePresence>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const badge = typeBadge[item.type] ?? typeBadge.Produk
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.03 }}
                    >
                      <div className="flex items-start gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm sm:p-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Badge variant={badge.variant} className="text-[9px] px-1.5 py-0.5">
                              {badge.label}
                            </Badge>
                            <h3 className="text-[13px] font-semibold text-ink">{item.name}</h3>
                          </div>
                          <p className="text-[11px] text-surface-500 line-clamp-1">{item.description}</p>
                          <p className="mt-1 text-[10px] text-surface-400">
                            {item.submitter} · {item.date}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-[11px] text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                            onClick={() => handleAction(item.id, 'reject')}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline ml-1">Reject</span>
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 bg-primary-600 px-2.5 text-[11px] hover:bg-primary-700"
                            onClick={() => handleAction(item.id, 'approve')}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline ml-1">Approve</span>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>

            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-primary-400" />
                <p className="mt-2 text-sm font-semibold text-ink">Semua sudah diproses!</p>
                <p className="mt-1 text-xs text-surface-500">Tidak ada item yang menunggu approval.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rekber" className="mt-4">
          <AdminApprovalRekberPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
