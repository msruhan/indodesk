'use client'

import { RekberTransactionList } from '@/components/rekber/rekber-transaction-list'
import { useRekberList } from '@/hooks/use-rekber-list'

export function AdminApprovalRekberPanel() {
  const { items, stats, loading, error, actingId, load, adminResolve } =
    useRekberList('/api/admin/rekber')

  return (
    <div className="space-y-6">
      <p className="text-sm text-surface-600">
        Pantau dan mediasi transaksi rekening bersama (escrow) dari tab Approval.
      </p>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <RekberTransactionList
        items={items}
        stats={stats}
        loading={loading}
        actingId={actingId}
        onRefresh={() => void load()}
        onAdminResolve={adminResolve}
      />
    </div>
  )
}
