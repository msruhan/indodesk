'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { InspectionCreateForm } from '@/components/inspection/inspection-create-form'
import type { PublicTeknisiDetailDto } from '@/lib/teknisi-public-detail'
import type { InspectionMode } from '@prisma/client'
import { X } from '@/lib/icons'

type Props = {
  teknisi: PublicTeknisiDetailDto
  open: boolean
  onClose: () => void
  initialMode?: InspectionMode
  lockMode?: boolean
  onSuccess?: (orderId: string) => void
}

export function InspectionBookingDialog({
  teknisi,
  open,
  onClose,
  initialMode = 'ONLINE',
  lockMode = false,
  onSuccess,
}: Props) {
  const router = useRouter()
  const { status: sessionStatus } = useSession()

  if (!open) return null

  const handleSuccess = (orderId: string) => {
    onClose()
    onSuccess?.(orderId)
  }

  if (sessionStatus !== 'authenticated') {
    const callback = encodeURIComponent(`/teknisi/${teknisi.id}`)
    return (
      <motion.div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          aria-label="Tutup"
          onClick={onClose}
        />
        <motion.div className="relative z-10 w-full max-w-md rounded-t-3xl border border-surface-200/80 bg-white p-5 shadow-soft-lg sm:rounded-3xl">
          <h2 className="text-lg font-bold text-ink">Login diperlukan</h2>
          <p className="mt-2 text-sm text-surface-600">
            Masuk sebagai user untuk memesan inspeksi dengan {teknisi.name}.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-700"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => router.push(`/login?callbackUrl=${callback}`)}
              className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Login
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Tutup"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(92vh,820px)] w-full max-w-lg flex-col rounded-t-3xl border border-surface-200/80 bg-surface-50 shadow-soft-lg sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-surface-200/70 bg-white px-5 py-4 sm:rounded-t-3xl">
          <motion.div>
            <h2 className="text-lg font-bold text-ink">Permintaan inspeksi</h2>
            <p className="text-xs text-surface-500">dengan {teknisi.name}</p>
            <p className="mt-1 text-[11px] text-surface-400">
              Biaya dipotong dari saldo wallet setelah konfirmasi
            </p>
          </motion.div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <InspectionCreateForm
            fixedTeknisiId={teknisi.id}
            initialMode={initialMode}
            lockMode={lockMode}
            onSuccess={handleSuccess}
            embedded
          />
        </div>
      </div>
    </motion.div>
  )
}
