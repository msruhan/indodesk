'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { SectionTabs } from '@/components/mobile/section-tabs'
import { marketplaceTabs } from '@/lib/section-tab-config'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Reveal, AuroraBackground } from '@/components/motion'
import {
  Search,
  Smartphone,
  Shield,
  Clock,
  Check,
  ChevronRight,
  Unlock,
  X,
  FileText,
  ArrowRight,
  AlertCircle,
  Package,
} from '@/lib/icons'
import {
  formatImeiPrice,
  mapApiGroup,
  mapApiServerBox,
  mapApiServerService,
  mapApiService,
  type PublicImeiService,
  type PublicImeiServiceGroup,
  type PublicServerService,
  type PublicServerServiceBox,
} from '@/lib/imei-public'
import {
  CatalogPagination,
  CATALOG_PAGE_SIZE,
  catalogPageRange,
  getCatalogPageCount,
  paginateCatalogItems,
} from '@/components/imei/catalog-pagination'
import {
  CatalogViewToggle,
  loadCatalogViewMode,
  saveCatalogViewMode,
  type CatalogViewMode,
} from '@/components/imei/catalog-view-toggle'
import { ImeiServiceCard, ImeiServiceCardSkeleton } from '@/components/imei/imei-service-card'
import { ServerOrderModal, ServerServiceCard } from '@/components/imei/server-catalog'
import { CatalogTabs, type CatalogTab } from '@/components/imei/catalog-tabs'
import { CatalogGroupFilter, type CatalogGroupFilterOption } from '@/components/imei/catalog-group-filter'

function OrderModal({
  service,
  onClose,
}: {
  service: PublicImeiService
  onClose: () => void
}) {
  const [imei, setImei] = useState('')
  const [network, setNetwork] = useState('')
  const [model, setModel] = useState('')
  const [provider, setProvider] = useState('')
  const [pin, setPin] = useState('')
  const [kbh, setKbh] = useState('')
  const [mep, setMep] = useState('')
  const [prd, setPrd] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderCode, setOrderCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const imeiNeeded = service.requiresImei
  const imeiValid = !imeiNeeded || (imei.length >= 15 && imei.length <= 17)
  const imeiShort = imeiNeeded && imei.length > 0 && imei.length < 15

  const canSubmit =
    imeiValid &&
    (!service.requiresNetwork || network.trim().length > 0) &&
    (!service.requiresModel || model.trim().length > 0) &&
    (!service.requiresProvider || provider.trim().length > 0) &&
    (!service.requiresPin || pin.trim().length > 0) &&
    (!service.requiresKbh || kbh.trim().length > 0) &&
    (!service.requiresMep || mep.trim().length > 0) &&
    (!service.requiresPrd || prd.trim().length > 0) &&
    (!service.requiresSn || serialNumber.trim().length > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/imei/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          imei,
          network: network || null,
          model: model || null,
          provider: provider || null,
          pin: pin || null,
          kbh: kbh || null,
          mep: mep || null,
          prd: prd || null,
          serialNumber: serialNumber || null,
          note: note || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        if (res.status === 401) {
          setError('Silakan login terlebih dahulu untuk membuat order.')
          return
        }
        setError(json.error ?? 'Gagal membuat order')
        return
      }
      setOrderCode(json.data?.orderCode ?? '')
      setSuccess(true)
    } catch {
      setError('Koneksi gagal. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-lg rounded-2xl border border-surface-200/70 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50"
            >
              <Check className="h-8 w-8 text-primary-600" />
            </motion.div>
            <h3 className="text-lg font-semibold text-ink">Order Berhasil!</h3>
            <p className="mt-2 text-sm text-surface-500">
              Order kamu sedang diproses. Kamu bisa cek status di halaman riwayat order.
            </p>
            <div className="mt-4 rounded-xl bg-surface-50 p-3 text-left">
              {orderCode && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-between text-xs"
                >
                  <span className="text-surface-500">Kode order</span>
                  <span className="font-mono font-medium text-ink">{orderCode}</span>
                </motion.div>
              )}
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-surface-500">Nomor perangkat</span>
                <span className="font-mono font-medium text-ink">{imei}</span>
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-surface-500">Service</span>
                <span className="font-medium text-ink">{service.title}</span>
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-surface-500">Harga</span>
                <span className="font-semibold text-primary-600">{formatImeiPrice(service.price)}</span>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/imei/orders">
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  Lihat riwayat
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Tutup
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-ink">Buat Order</h3>
                <p className="mt-0.5 text-xs text-surface-500">
                  Isi data berikut untuk memproses order
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border border-primary-100 bg-primary-50/50 p-3"
            >
              <motion.div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                  <Unlock className="h-4 w-4 text-primary-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink">{service.title}</p>
                  <p className="text-[10px] text-surface-500">{service.groupName}</p>
                </div>
              </motion.div>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-surface-600">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {service.deliveryTime}
                </span>
                <span className="font-semibold text-primary-700">{formatImeiPrice(service.price)}</span>
              </div>
            </motion.div>

            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
                {error.includes('login') && (
                  <Link href="/login" className="mt-1 block font-semibold underline">
                    Login sekarang
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {service.requiresImei && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">
                    Nomor perangkat <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Masukkan 15–17 digit (dial *#06#)"
                    value={imei}
                    onChange={(e) => setImei(e.target.value.replace(/\D/g, '').slice(0, 17))}
                    className="h-10 font-mono text-sm"
                    maxLength={17}
                  />
                  <p
                    className={cn(
                      'mt-1 text-[10px]',
                      imeiShort ? 'font-medium text-red-600' : 'text-surface-400',
                    )}
                  >
                    Nomor tampil saat dial *#06# di HP. {imei.length}/17 digit
                    {imei.length > 0 && imei.length < 15 && (
                      <> — masih kurang {15 - imei.length} digit</>
                    )}
                  </p>
                </div>
              )}

              {service.requiresNetwork && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Network/Carrier</label>
                  <Input
                    type="text"
                    placeholder="Contoh: AT&T, T-Mobile"
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              )}

              {service.requiresModel && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Model</label>
                  <Input
                    type="text"
                    placeholder="Contoh: iPhone 15 Pro Max"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              )}

              {service.requiresProvider && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Provider</label>
                  <Input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              )}

              {service.requiresPin && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">PIN</label>
                  <Input type="text" value={pin} onChange={(e) => setPin(e.target.value)} className="h-10 text-sm" />
                </div>
              )}

              {service.requiresKbh && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">KBH</label>
                  <Input type="text" value={kbh} onChange={(e) => setKbh(e.target.value)} className="h-10 text-sm" />
                </div>
              )}

              {service.requiresMep && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">MEP</label>
                  <Input type="text" value={mep} onChange={(e) => setMep(e.target.value)} className="h-10 text-sm" />
                </div>
              )}

              {service.requiresPrd && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">PRD</label>
                  <Input type="text" value={prd} onChange={(e) => setPrd(e.target.value)} className="h-10 text-sm" />
                </div>
              )}

              {service.requiresSn && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Serial Number</label>
                  <Input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-ink">Catatan (opsional)</label>
                <textarea
                  placeholder="Tambahkan catatan jika diperlukan..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-surface-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  rows={2}
                />
              </div>

              <div className="rounded-xl bg-surface-50 p-3">
                <motion.div className="flex justify-between text-xs">
                  <span className="text-surface-500">Harga layanan</span>
                  <span className="font-medium text-ink">{formatImeiPrice(service.price)}</span>
                </motion.div>
                <div className="mt-2 border-t border-surface-200 pt-2 flex justify-between">
                  <span className="text-xs font-semibold text-ink">Total</span>
                  <span className="text-sm font-bold text-primary-600">{formatImeiPrice(service.price)}</span>
                </div>
              </div>

              {!canSubmit && !submitting && (
                <p className="text-center text-[11px] text-amber-700">
                  {imeiShort
                    ? 'Lengkapi nomor perangkat minimal 15 digit untuk melanjutkan.'
                    : 'Lengkapi semua field wajib sebelum submit.'}
                </p>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={!canSubmit || submitting}>
                {submitting ? 'Memproses...' : `Submit Order — ${formatImeiPrice(service.price)}`}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function ImeiPage() {
  const [catalogTab, setCatalogTab] = useState<CatalogTab>('imei')
  const [query, setQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState('all')
  const [orderService, setOrderService] = useState<PublicImeiService | null>(null)
  const [orderServerService, setOrderServerService] = useState<PublicServerService | null>(null)
  const [services, setServices] = useState<PublicImeiService[]>([])
  const [groups, setGroups] = useState<PublicImeiServiceGroup[]>([])
  const [serverServices, setServerServices] = useState<PublicServerService[]>([])
  const [serverBoxes, setServerBoxes] = useState<PublicServerServiceBox[]>([])
  const [loading, setLoading] = useState(true)
  const [serverLoading, setServerLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [serverFetchError, setServerFetchError] = useState<string | null>(null)
  const [serverLoaded, setServerLoaded] = useState(false)
  const [viewMode, setViewMode] = useState<CatalogViewMode>('grid')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setViewMode(loadCatalogViewMode())
  }, [])

  const handleViewModeChange = (mode: CatalogViewMode) => {
    setViewMode(mode)
    saveCatalogViewMode(mode)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const loadServices = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/imei/services', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setFetchError(json.error ?? 'Gagal memuat layanan')
        setServices([])
        setGroups([])
        return
      }
      setServices((json.data?.services ?? []).map(mapApiService))
      setGroups(
        (json.data?.groups ?? [])
          .map(mapApiGroup)
          .filter((g: PublicImeiServiceGroup) => g.servicesCount > 0),
      )
    } catch {
      setFetchError('Koneksi gagal. Periksa jaringan dan coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadServerServices = useCallback(async () => {
    setServerLoading(true)
    setServerFetchError(null)
    try {
      const res = await fetch('/api/imei/server-services', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setServerFetchError(json.error ?? 'Gagal memuat layanan server')
        setServerServices([])
        setServerBoxes([])
        return
      }
      setServerServices((json.data?.services ?? []).map(mapApiServerService))
      setServerBoxes(
        (json.data?.boxes ?? [])
          .map(mapApiServerBox)
          .filter((b: PublicServerServiceBox) => b.servicesCount > 0),
      )
      setServerLoaded(true)
    } catch {
      setServerFetchError('Koneksi gagal. Periksa jaringan dan coba lagi.')
    } finally {
      setServerLoading(false)
    }
  }, [])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  useEffect(() => {
    if (catalogTab === 'server' && !serverLoaded && !serverLoading) {
      loadServerServices()
    }
  }, [catalogTab, serverLoaded, serverLoading, loadServerServices])

  const filteredImei = useMemo(() => {
    return services.filter((s) => {
      const matchesQuery =
        !query.trim() ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.groupName.toLowerCase().includes(query.toLowerCase()) ||
        (s.description?.toLowerCase().includes(query.toLowerCase()) ?? false)
      const matchesGroup = activeGroup === 'all' || s.groupId === activeGroup
      return matchesQuery && matchesGroup
    })
  }, [query, activeGroup, services])

  const filteredServer = useMemo(() => {
    return serverServices.filter((s) => {
      const matchesQuery =
        !query.trim() ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.boxName.toLowerCase().includes(query.toLowerCase()) ||
        (s.description?.toLowerCase().includes(query.toLowerCase()) ?? false)
      const matchesBox = activeGroup === 'all' || s.boxId === activeGroup
      return matchesQuery && matchesBox
    })
  }, [query, activeGroup, serverServices])

  const isImeiTab = catalogTab === 'imei'
  const listLoading = isImeiTab ? loading : serverLoading
  const listError = isImeiTab ? fetchError : serverFetchError
  const filtered = isImeiTab ? filteredImei : filteredServer
  const totalCount = isImeiTab ? services.length : serverServices.length
  const groupFilters = isImeiTab ? groups : serverBoxes

  const groupFilterOptions = useMemo((): CatalogGroupFilterOption[] => {
    const options: CatalogGroupFilterOption[] = [
      { id: 'all', label: 'Semua', count: totalCount },
    ]
    for (const group of groupFilters) {
      const count = isImeiTab
        ? services.filter((s) => s.groupId === group.id).length
        : serverServices.filter((s) => s.boxId === group.id).length
      if (count === 0) continue
      options.push({ id: group.id, label: group.title, count })
    }
    return options
  }, [groupFilters, isImeiTab, services, serverServices, totalCount])

  const switchCatalogTab = (tab: CatalogTab) => {
    setCatalogTab(tab)
    setActiveGroup('all')
    setQuery('')
    setCurrentPage(1)
  }

  const pageSize = CATALOG_PAGE_SIZE[viewMode]
  const totalPages = getCatalogPageCount(filtered.length, pageSize)
  const safePage = Math.min(currentPage, totalPages)
  const paginatedImei = paginateCatalogItems(filteredImei, safePage, pageSize)
  const paginatedServer = paginateCatalogItems(filteredServer, safePage, pageSize)
  const pageRange = catalogPageRange(safePage, pageSize, filtered.length)

  useEffect(() => {
    setCurrentPage(1)
  }, [query, activeGroup, catalogTab, viewMode])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen overflow-x-hidden bg-surface-50"
    >
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <section className="relative overflow-hidden pb-6 lg:pt-28">
        <AuroraBackground intensity="subtle" />
        <SectionTabs tabs={marketplaceTabs} layoutId="marketplace-section-tab" variant="merged" />

        <div className="relative mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-10 lg:px-8">
          <Reveal noBlur>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200/60 bg-primary-50/70 px-3 py-1 text-[11px] font-medium text-primary-700 backdrop-blur-md">
                  <Smartphone className="h-3 w-3" />
                  Layanan Perangkat & Cek Status
                </span>
                <h1 className="mt-3 text-balance text-[28px] font-semibold leading-[1.05] tracking-tightest text-ink sm:text-4xl lg:text-[44px]">
                  Layanan HP
                  <span className="block">
                    <span className="gradient-text-static">cepat & terpercaya</span>.
                  </span>
                </h1>
                <p className="mt-3 max-w-xl text-pretty text-sm text-surface-600 sm:text-base">
                  Katalog layanan perangkat & server dari admin — cek status, FRP, aktivasi tool, dan lainnya.
                </p>
              </div>
              <Link
                href="/imei/orders"
                className="inline-flex items-center gap-2 self-start rounded-full border border-surface-200/70 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-surface-700 backdrop-blur-md transition-colors hover:border-surface-300 hover:text-ink sm:self-auto"
              >
                <FileText className="h-3.5 w-3.5 text-primary-600" />
                Riwayat order
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Reveal>

          <Reveal noBlur delay={0.03}>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full border border-surface-200/70 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-surface-700 backdrop-blur-md">
                <Shield className="h-3.5 w-3.5 text-primary-600" />
                Garansi 100% atau uang kembali
              </div>
              {!loading && services.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-full border border-surface-200/70 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-surface-700 backdrop-blur-md">
                  <Check className="h-3.5 w-3.5 text-primary-600" />
                  {services.length} layanan perangkat aktif
                </div>
              )}
              {serverLoaded && serverServices.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1.5 text-[11px] font-medium text-amber-800 backdrop-blur-md">
                  <Package className="h-3.5 w-3.5" />
                  {serverServices.length} server aktif
                </div>
              )}
            </div>
          </Reveal>

          <Reveal noBlur delay={0.04}>
            <div className="mt-4">
              <CatalogTabs
                value={catalogTab}
                onChange={switchCatalogTab}
                imeiCount={!loading ? services.length : undefined}
                serverCount={serverLoaded ? serverServices.length : undefined}
              />
            </div>
          </Reveal>

          <Reveal noBlur delay={0.05}>
            <div className="mt-4 relative">
              <Search className={cn(searchInputIconClass, 'left-4')} strokeWidth={2} aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder={isImeiTab ? 'Cari layanan perangkat...' : 'Cari layanan server...'}
                className="h-11 pl-11"
                disabled={listLoading}
              />
            </div>
          </Reveal>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        {listError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{listError}</span>
            <Button variant="ghost" size="sm" onClick={isImeiTab ? loadServices : loadServerServices}>
              Coba lagi
            </Button>
          </div>
        )}

        <Reveal noBlur>
          <div className="mb-5">
            <CatalogGroupFilter
              value={activeGroup}
              onChange={setActiveGroup}
              options={groupFilterOptions}
              variant={isImeiTab ? 'primary' : 'amber'}
              loading={listLoading}
            />
          </div>
        </Reveal>

        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-surface-500">
            {listLoading
              ? 'Memuat layanan...'
              : filtered.length === 0
                ? `Tidak ada ${isImeiTab ? 'layanan perangkat' : 'layanan server'}`
                : `Menampilkan ${pageRange.start}–${pageRange.end} dari ${filtered.length} ${isImeiTab ? 'layanan perangkat' : 'layanan server'}`}
          </p>
          <CatalogViewToggle
            mode={viewMode}
            onChange={handleViewModeChange}
            variant={isImeiTab ? 'primary' : 'amber'}
            disabled={listLoading}
          />
        </div>

        {listLoading ? (
          <div
            className={cn(
              'pb-4',
              viewMode === 'list'
                ? 'flex flex-col gap-1'
                : 'grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3',
            )}
          >
            {Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
              <ImeiServiceCardSkeleton key={i} layout={viewMode} />
            ))}
          </div>
        ) : isImeiTab ? (
          <>
            <div
              className={cn(
                'pb-4',
                viewMode === 'list'
                  ? 'flex flex-col gap-1'
                  : 'grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3',
              )}
            >
              {paginatedImei.map((service) => (
                <ImeiServiceCard
                  key={service.id}
                  service={service}
                  layout={viewMode}
                  onOrder={setOrderService}
                />
              ))}
            </div>
            <CatalogPagination
              page={safePage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              variant="primary"
              className="pb-20 lg:pb-0"
            />
          </>
        ) : (
          <>
            <div
              className={cn(
                'pb-4',
                viewMode === 'list'
                  ? 'flex flex-col gap-1'
                  : 'grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3',
              )}
            >
              {paginatedServer.map((service) => (
                <ServerServiceCard
                  key={service.id}
                  service={service}
                  layout={viewMode}
                  onOrder={setOrderServerService}
                />
              ))}
            </div>
            <CatalogPagination
              page={safePage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              variant="amber"
              className="pb-20 lg:pb-0"
            />
          </>
        )}

        {!listLoading && filtered.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
            <Search className="mx-auto h-6 w-6 text-ink-muted" strokeWidth={2} aria-hidden />
            <p className="mt-3 text-sm font-semibold text-ink">
              {totalCount === 0
                ? isImeiTab
                  ? 'Belum ada layanan perangkat aktif'
                  : 'Belum ada layanan server aktif'
                : 'Layanan tidak ditemukan'}
            </p>
            <p className="mt-1 text-xs text-surface-500">
              {totalCount === 0
                ? 'Admin perlu mengimpor layanan dari API Manager dan mengaktifkannya.'
                : 'Coba kata kunci lain atau ubah kategori.'}
            </p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {orderService && <OrderModal service={orderService} onClose={() => setOrderService(null)} />}
        {orderServerService && (
          <ServerOrderModal service={orderServerService} onClose={() => setOrderServerService(null)} />
        )}
      </AnimatePresence>

      <MobileSafeAreaSpacer />
      <BottomNav />
    </motion.div>
  )
}
