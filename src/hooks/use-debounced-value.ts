import { useEffect, useState } from 'react'

/**
 * Debounce a value — returns the debounced version that only updates
 * after `delay` ms of inactivity.
 *
 * Usage:
 *   const [q, setQ] = useState('')
 *   const debouncedQ = useDebouncedValue(q, 250)
 *   // use debouncedQ in useCallback/useEffect dependencies
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
