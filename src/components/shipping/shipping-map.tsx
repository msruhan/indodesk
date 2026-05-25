'use client'

import { useEffect, useRef } from 'react'
import type { OrderTrackingDto } from '@/lib/order-tracking-sync'

/** Koordinat kota Indonesia (lat, lng) */
const CITY_COORDS: Record<string, [number, number]> = {
  'jakarta': [-6.2088, 106.8456],
  'jakarta selatan': [-6.2615, 106.8106],
  'jakarta pusat': [-6.1862, 106.8340],
  'jakarta barat': [-6.1682, 106.7637],
  'jakarta timur': [-6.2250, 106.9004],
  'jakarta utara': [-6.1382, 106.8713],
  'tangerang': [-6.1783, 106.6319],
  'bekasi': [-6.2349, 106.9896],
  'depok': [-6.4025, 106.7942],
  'bogor': [-6.5971, 106.8060],
  'karawang': [-6.3218, 107.3381],
  'purwakarta': [-6.5567, 107.4432],
  'bandung': [-6.9175, 107.6191],
  'bandung kota': [-6.9175, 107.6191],
  'garut': [-7.2167, 107.9000],
  'tasikmalaya': [-7.3274, 108.2207],
  'cirebon': [-6.7063, 108.5570],
  'semarang': [-6.9932, 110.4203],
  'solo': [-7.5755, 110.8243],
  'yogyakarta': [-7.7956, 110.3695],
  'surabaya': [-7.2575, 112.7521],
  'malang': [-7.9797, 112.6304],
  'denpasar': [-8.6705, 115.2126],
  'bali': [-8.4095, 115.1889],
  'medan': [3.5952, 98.6722],
  'palembang': [-2.9761, 104.7754],
  'lampung': [-5.4500, 105.2667],
  'sukabumi': [-6.9277, 106.9300],
  'makassar': [-5.1477, 119.4327],
  'jne hub jakarta': [-6.2088, 106.8456],
  'jne hub bandung': [-6.9175, 107.6191],
  'jne cabang bandung': [-6.9300, 107.6100],
  'jne gateway jakarta': [-6.1900, 106.8200],
}

function findCityCoord(location: string): [number, number] | null {
  const lower = location.toLowerCase().trim()
  if (CITY_COORDS[lower]) return CITY_COORDS[lower]
  for (const [key, coord] of Object.entries(CITY_COORDS)) {
    if (lower.includes(key) || key.includes(lower.split(',')[0].trim())) return coord
  }
  const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/)
  for (const word of words) {
    if (word.length < 4) continue
    for (const [key, coord] of Object.entries(CITY_COORDS)) {
      if (key.includes(word) || word.includes(key.split(' ')[0])) return coord
    }
  }
  return null
}

const MERGE_DISTANCE_DEG = 0.03 // ~3km — tighter merge to keep distinct stops visible

type Props = {
  tracking: OrderTrackingDto
  isDelivered: boolean
}

export function ShippingMap({ tracking, isDelivered }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Dynamic import to avoid SSR issues
    void (async () => {
      const L = (await import('leaflet')).default

      // Fix default icon paths for Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Resolve route points
      const chronological = [...tracking.events].reverse()
      const locations = chronological.filter((e) => e.location).map((e) => e.location!)

      type Point = { latlng: [number, number]; label: string; loc: string }
      const allResolved: Point[] = []
      for (const loc of locations) {
        const coord = findCityCoord(loc)
        if (!coord) continue
        allResolved.push({ latlng: coord, label: loc, loc })
      }

      // Deduplicate nearby points
      const routePoints: Point[] = []
      for (const p of allResolved) {
        const last = routePoints[routePoints.length - 1]
        if (last) {
          const dist = Math.hypot(last.latlng[0] - p.latlng[0], last.latlng[1] - p.latlng[1])
          if (dist < MERGE_DISTANCE_DEG) continue
        }
        routePoints.push(p)
      }

      if (routePoints.length === 0) return

      // Calculate bounds with generous padding so all markers + labels fit
      const lats = routePoints.map((p) => p.latlng[0])
      const lngs = routePoints.map((p) => p.latlng[1])
      const latPad = 0.15
      const lngPad = 0.25
      const bounds = L.latLngBounds(
        [Math.min(...lats) - latPad, Math.min(...lngs) - lngPad],
        [Math.max(...lats) + latPad, Math.max(...lngs) + lngPad],
      )

      // Init map — allow zoom interaction
      const map = L.map(mapRef.current!, {
        zoomControl: true,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        keyboard: false,
      })
      mapInstanceRef.current = map

      // Tile layer — CartoDB Positron (clean, light, no labels clutter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      // Fit bounds with padding so labels don't get cut off
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })

      // Draw route polyline (full route — dashed gray background)
      const latlngs = routePoints.map((p) => p.latlng)
      L.polyline(latlngs, {
        color: '#d1d5db',
        weight: 3,
        opacity: 0.7,
        dashArray: '6 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)

      // Solid green progress line
      const progressIdx = isDelivered
        ? routePoints.length - 1
        : Math.max(0, Math.floor(routePoints.length * 0.7))
      L.polyline(latlngs.slice(0, progressIdx + 1), {
        color: '#059669',
        weight: 4,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)

      // Custom marker icons
      const makeIcon = (color: string, size: number) =>
        L.divIcon({
          className: '',
          html: `<div style="
            width:${size}px;height:${size}px;
            background:${color};
            border:2.5px solid white;
            border-radius:50%;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
          "></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })

      // Place markers
      routePoints.forEach((point, idx) => {
        const isFirst = idx === 0
        const isLast = idx === routePoints.length - 1
        const passed = isDelivered || idx <= progressIdx

        const icon = makeIcon(
          passed ? '#059669' : '#d1d5db',
          isFirst || isLast ? 16 : 11,
        )

        const marker = L.marker(point.latlng, { icon })
        marker.addTo(map)

        // Tooltip label — alternate direction to avoid overlap
        const shortLabel = point.loc.length > 25 ? point.loc.slice(0, 25) + '…' : point.loc
        const direction: 'top' | 'bottom' | 'left' | 'right' =
          isFirst ? 'top' : isLast ? 'bottom' : idx % 2 === 0 ? 'right' : 'left'
        marker.bindTooltip(shortLabel, {
          permanent: true,
          direction,
          offset: direction === 'top' ? [0, -10] : direction === 'bottom' ? [0, 10] : direction === 'right' ? [10, 0] : [-10, 0],
          className: 'shipping-tooltip',
        }).openTooltip()
      })

      // Animated truck — moves from point to point, looping continuously
      const truckIcon = L.divIcon({
        className: 'truck-marker',
        html: `<div style="font-size:24px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚚</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      const truckMarker = L.marker(routePoints[0].latlng, { icon: truckIcon, zIndexOffset: 1000 })
      truckMarker.addTo(map)

      // Smooth animation: interpolate between points over duration
      const SEGMENT_DURATION = 1500 // ms per segment
      const PAUSE_AT_STOP = 500 // ms pause at each stop
      const PAUSE_AT_END = 2000 // ms pause before looping

      function animateTruck() {
        let currentSegment = 0
        let startTime = performance.now()

        function step(now: number) {
          if (currentSegment >= routePoints.length - 1) {
            // Reached end — pause then restart
            animTimeoutRef.current = setTimeout(() => {
              currentSegment = 0
              truckMarker.setLatLng(routePoints[0].latlng)
              startTime = performance.now()
              animFrameRef.current = requestAnimationFrame(step)
            }, PAUSE_AT_END)
            return
          }

          const elapsed = now - startTime
          const progress = Math.min(elapsed / SEGMENT_DURATION, 1)

          // Ease-in-out
          const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2

          const from = routePoints[currentSegment].latlng
          const to = routePoints[currentSegment + 1].latlng
          const lat = from[0] + (to[0] - from[0]) * eased
          const lng = from[1] + (to[1] - from[1]) * eased

          truckMarker.setLatLng([lat, lng])

          if (progress >= 1) {
            // Arrived at next stop — pause briefly then continue
            currentSegment++
            startTime = now + PAUSE_AT_STOP
          }

          animFrameRef.current = requestAnimationFrame(step)
        }

        animFrameRef.current = requestAnimationFrame(step)
      }

      // Start animation after a short delay
      animTimeoutRef.current = setTimeout(animateTruck, 1000)

      // Delivered: destination marker with checkmark
      if (isDelivered) {
        const destIcon = L.divIcon({
          className: '',
          html: `<div style="
            width:20px;height:20px;
            background:#059669;
            border:3px solid white;
            border-radius:50%;
            box-shadow:0 2px 8px rgba(5,150,105,0.5);
            display:flex;align-items:center;justify-content:center;
            font-size:11px;color:white;font-weight:bold;
          ">✓</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
        L.marker(routePoints[routePoints.length - 1].latlng, { icon: destIcon, zIndexOffset: 2000 }).addTo(map)
      }
    })()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [tracking, isDelivered])

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <style>{`
        .shipping-tooltip {
          background: rgba(5,150,105,0.92) !important;
          border: none !important;
          border-radius: 6px !important;
          color: white !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          padding: 3px 8px !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
          white-space: nowrap !important;
        }
        .shipping-tooltip::before {
          border-top-color: rgba(5,150,105,0.92) !important;
        }
        .leaflet-tooltip-bottom.shipping-tooltip::before {
          border-bottom-color: rgba(5,150,105,0.92) !important;
          border-top-color: transparent !important;
        }
      `}</style>
      <div ref={mapRef} className="h-full w-full rounded-xl" />
    </>
  )
}
