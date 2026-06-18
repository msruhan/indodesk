'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { TeknisiKonsultasiDto } from '@/lib/teknisi-layanan-serializer'

const POLL_MS = 15_000

/**
 * Popup notifikasi saat ada konsultasi remote baru (pending, pembayaran aman).
 * Hanya menampilkan request yang belum pernah ditampilkan di sesi ini.
 */
export function TeknisiRemoteRequestNotifier() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const confirm = useConfirm()
  const seenIdsRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)
  const showingRef = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || session?.user?.role !== 'TEKNISI') return

    const poll = async () => {
      if (showingRef.current) return
      try {
        const res = await fetch('/api/teknisi/konsultasi', { cache: 'no-store' })
        const json = (await res.json()) as {
          success?: boolean
          data?: { items: TeknisiKonsultasiDto[] }
        }
        if (!json.success || !json.data?.items) return

        const waiting = json.data.items.filter(
          (item) => item.requiresRemote && item.status === 'pending' && item.canStart,
        )

        if (!initializedRef.current) {
          for (const item of waiting) {
            seenIdsRef.current.add(item.id)
          }
          initializedRef.current = true
          return
        }

        for (const req of waiting) {
          if (seenIdsRef.current.has(req.id)) continue
          seenIdsRef.current.add(req.id)
          showingRef.current = true

          const goToKonsultasi = await confirm({
            title: 'Konsultasi remote baru',
            description: `${req.userName} — ${req.service}\nIndoDesk ID: ${req.remoteId ?? '—'}`,
            variant: 'notification',
            confirmLabel: 'Lihat konsultasi',
            cancelLabel: 'Nanti',
          })

          showingRef.current = false
          if (goToKonsultasi) {
            router.push('/teknisi/konsultasi?filter=remote')
            break
          }
        }
      } catch {
        showingRef.current = false
      }
    }

    void poll()
    const interval = setInterval(() => void poll(), POLL_MS)
    return () => clearInterval(interval)
  }, [status, session?.user?.role, confirm, router])

  return null
}
