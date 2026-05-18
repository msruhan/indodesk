'use client'

import { useCallback, useEffect, useState } from 'react'
import type { UserProfileDto } from '@/lib/user-profile-serializer'

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfileDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/user/profile')
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
