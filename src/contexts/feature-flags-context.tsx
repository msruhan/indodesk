'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  DEFAULT_PUBLIC_FEATURE_FLAGS,
  type PublicFeatureFlags,
} from '@/lib/platform-settings-shared'

type FeatureFlagsContextValue = {
  flags: PublicFeatureFlags
  loading: boolean
  refresh: () => Promise<void>
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  flags: DEFAULT_PUBLIC_FEATURE_FLAGS,
  loading: true,
  refresh: async () => undefined,
})

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<PublicFeatureFlags>(DEFAULT_PUBLIC_FEATURE_FLAGS)
  const [loading, setLoading] = useState(true)

  const fetchFlags = async () => {
    try {
      const res = await fetch('/api/platform/feature-flags', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && json?.success && json?.data) {
        setFlags({
          imeiServiceEnabled: Boolean(json.data.imeiServiceEnabled),
          remoteServiceEnabled: Boolean(json.data.remoteServiceEnabled),
          inspectionServiceEnabled: Boolean(json.data.inspectionServiceEnabled),
        })
      }
    } catch {
      // Tetap pakai default — tidak boleh memecah UI.
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchFlags()
  }, [])

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, refresh: fetchFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext)
}
