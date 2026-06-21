'use client'

import { useEffect, useState } from 'react'

/** True when platform soft-launch (coming soon) mode is enabled. */
export function useComingSoonActive(): boolean {
  const [active, setActive] = useState(false)

  useEffect(() => {
    void fetch('/api/public/coming-soon')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.enabled) setActive(true)
      })
      .catch(() => {})
  }, [])

  return active
}
