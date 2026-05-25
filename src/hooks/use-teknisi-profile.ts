'use client'

import { useCallback, useEffect, useState } from 'react'
import type { TeknisiAccountProfileDto } from '@/lib/teknisi-profile-serializer'

export function useTeknisiProfile() {
  const [profile, setProfile] = useState<TeknisiAccountProfileDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/teknisi/profile')
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Gagal memuat profil')
        return
      }
      setProfile(data.data)
    } catch {
      setError('Gagal memuat profil')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { profile, loading, error, reload: load, setProfile }
}
