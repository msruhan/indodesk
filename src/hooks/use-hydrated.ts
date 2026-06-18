import { useEffect, useState } from 'react'

/**
 * True only after the client has mounted.
 * Uses useState+useEffect (not useSyncExternalStore) so the first client paint
 * matches SSR — avoids hydration mismatches with Framer Motion layoutId.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}
