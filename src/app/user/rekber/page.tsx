'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from '@/lib/icons'
import { RekberTransactionList } from '@/components/rekber/rekber-transaction-list'
import { RekberComplaintForm } from '@/components/rekber/rekber-complaint-form'
import { useRekberList } from '@/hooks/use-rekber-list'
import { useState } from 'react'

export default function UserRekberPage() {
  const {
    items,
    stats,
    loading,
    error,
    actingId,
    load,
    userAction,
    submitComplaint,
    respondComplaint,
    escalateComplaint,
    withdrawComplaint,
  } = useRekberList('/api/rekber')
  const [complaintOpenId, setComplaintOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Rekber Saya</h1>
          <p className="mt-1 text-sm text-surface-500">Transaksi aman dengan rekening bersama</p>
        </div>
        <Link href="/rekber">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajukan Rekber Baru
          </Button>
        </Link>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {complaintOpenId && (
        <RekberComplaintForm
          onSubmit={(payload) => submitComplaint(complaintOpenId, payload)}
          onCancel={() => setComplaintOpenId(null)}
        />
      )}

      <RekberTransactionList
        items={items}
        stats={stats}
        loading={loading}
        actingId={actingId}
        onRefresh={() => void load()}
        onUserAction={userAction}
        onOpenComplaint={(id) => setComplaintOpenId(id)}
        onRespondComplaint={(id) => {
          const response = window.prompt('Tulis respons komplain (min. 10 karakter):')
          if (!response) return
          void respondComplaint(id, response)
        }}
        onEscalateComplaint={(id) => void escalateComplaint(id)}
        onWithdrawComplaint={(id) => void withdrawComplaint(id)}
      />
    </div>
  )
}
