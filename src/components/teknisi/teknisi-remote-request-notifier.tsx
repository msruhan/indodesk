'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { TeknisiRemoteDto } from '@/lib/teknisi-layanan-serializer'

const POLL_MS = 15_000

/**
 * Popup notifikasi saat ada permintaan remote baru (status menunggu).
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
        const res = await fetch('/api/teknisi/remote', { cache: 'no-store' })
        const json = (await res.json()) as {
          success?: boolean
          data?: { items: TeknisiRemoteDto[] }
        }
        if (!json.success || !json.data?.items) return

        const waiting = json.data.items.filter((item) => item.status === 'waiting')

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

          const goToRemote = await confirm({
            title: 'Permintaan remote baru',
            description: `${req.userName} membutuhkan bantuan remote.\nKode sesi: ${req.remoteId}`,
            variant: 'notification',
            confirmLabel: 'Lihat request',
            cancelLabel: 'Nanti',
          })

          showingRef.current = false
          if (goToRemote) {
            router.push('/teknisi/remote')
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
