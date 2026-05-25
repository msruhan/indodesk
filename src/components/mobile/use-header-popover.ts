'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

type PopoverPosition = Pick<CSSProperties, 'top' | 'right'>

const VIEWPORT_SIDE_MARGIN = 16

type UseHeaderPopoverOptions = {
  /** Perkiraan lebar panel sebelum DOM diukur (px). */
  estimatedWidth?: number
}

export function useHeaderPopover<T extends HTMLElement = HTMLElement>(
  options?: UseHeaderPopoverOptions,
) {
  const anchorRef = useRef<T>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<PopoverPosition>({ top: 0, right: 0 })

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const vw = window.innerWidth

    const measured = panelRef.current?.offsetWidth ?? 0
    const panelWidth =
      measured > 0
        ? measured
        : (options?.estimatedWidth ?? Math.min(vw - VIEWPORT_SIDE_MARGIN * 2, 320))

    // Panel `right` = jarak dari tepi kanan viewport ke tepi kanan panel.
    // Default: sejajarkan tepi kanan panel dengan tombol pemicu.
    const idealRight = vw - rect.right
    const maxRight = Math.max(VIEWPORT_SIDE_MARGIN, vw - panelWidth - VIEWPORT_SIDE_MARGIN)
    const right = Math.min(Math.max(idealRight, VIEWPORT_SIDE_MARGIN), maxRight)

    setPosition({
      top: rect.bottom + 8,
      right,
    })
  }, [options?.estimatedWidth])

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
    const raf = requestAnimationFrame(() => updatePosition())
    const onLayout = () => updatePosition()
    window.addEventListener('resize', onLayout)
    window.addEventListener('scroll', onLayout, true)
    return () => {
      cancelAnimationFrame(raf)
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
      maxWidth: `calc(100vw - ${VIEWPORT_SIDE_MARGIN * 2}px)`,
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
