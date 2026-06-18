'use client'

import { RekberTransactionList } from '@/components/rekber/rekber-transaction-list'
import { AdminRekberPackagingPanel } from '@/components/admin/admin-rekber-packaging-panel'
import { useRekberList } from '@/hooks/use-rekber-list'

export default function AdminRekberPage() {
  const { items, stats, loading, error, actingId, load, adminResolve } =
    useRekberList('/api/admin/rekber')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">
          Manajemen Rekber (Escrow)
        </h1>
        <p className="mt-1 text-sm text-surface-500">Kelola semua transaksi rekening bersama</p>
      </div>

      <AdminRekberPackagingPanel />

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
