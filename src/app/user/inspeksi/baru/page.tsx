'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { InspectionCreateForm } from '@/components/inspection/inspection-create-form'

function BaruContent() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href="/user/inspeksi" className="text-sm text-primary-700 hover:underline">
          ← Kembali ke daftar inspeksi
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">Permintaan inspeksi baru</h1>
        <p className="text-sm text-surface-500">
          Biaya akan dipotong dari saldo wallet Anda setelah konfirmasi.
        </p>
      </div>
      <InspectionCreateForm />
    </div>
  )
}

export default function UserInspeksiBaruPage() {
  return (
    <Suspense fallback={<p className="text-sm text-surface-500">Memuat formulir...</p>}>
      <BaruContent />
    </Suspense>
  )
}
