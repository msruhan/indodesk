'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

type PopoverPosition = Pick<CSSProperties, 'top' | 'right'>

export function useHeaderPopover() {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<PopoverPosition>({ top: 0, right: 0 })

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    })
  }, [])

  const openPopover = useCallback(() => {
    updatePosition()
    setOpen(true)
  }, [updatePosition])

  const closePopover = useCallback(() => setOpen(false), [])

  const togglePopover = useCallback(() => {
    setOpen((current) => {
      if (current) return false
      updatePosition()
      return true
    })
  }, [updatePosition])

  useEffect(() => {
    if (!open) return
    updatePosition()
    const onLayout = () => updatePosition()
    window.addEventListener('resize', onLayout)
    window.addEventListener('scroll', onLayout, true)
    return () => {
      window.removeEventListener('resize', onLayout)
      window.removeEventListener('scroll', onLayout, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const panelStyle: CSSProperties = useMemo(
    () => ({
      position: 'fixed',
      top: position.top,
      right: position.right,
      zIndex: 200,
    }),
    [position.top, position.right],
  )

  return useMemo(
    () => ({
      anchorRef,
      panelRef,
      open,
      openPopover,
      closePopover,
      togglePopover,
      panelStyle,
    }),
    [open, openPopover, closePopover, togglePopover, panelStyle],
  )
}
