'use client'

import { RekberTransactionList } from '@/components/rekber/rekber-transaction-list'
import { useRekberList } from '@/hooks/use-rekber-list'

export default function TeknisiRekberPage() {
  const {
    items,
    stats,
    loading,
    error,
    actingId,
    load,
    respondComplaint,
    escalateComplaint,
    withdrawComplaint,
    advanceRekber,
    setShipment,
  } = useRekberList('/api/rekber')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Rekber Seller</h1>
        <p className="mt-1 text-sm text-surface-500">Pantau transaksi rekber sebagai penjual</p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <RekberTransactionList
        items={items}
        stats={stats}
        loading={loading}
        actingId={actingId}
        onRefresh={() => void load()}
        onRespondComplaint={(id) => {
          const response = window.prompt('Tulis respons komplain (min. 10 karakter):')
          if (!response) return
          void respondComplaint(id, response)
        }}
        onEscalateComplaint={(id) => void escalateComplaint(id)}
        onWithdrawComplaint={(id) => void withdrawComplaint(id)}
        onAdvance={advanceRekber}
        onSetShipment={(id, courier, trackingNumber) =>
          void setShipment(id, courier, trackingNumber)
        }
      />
    </div>
  )
}
