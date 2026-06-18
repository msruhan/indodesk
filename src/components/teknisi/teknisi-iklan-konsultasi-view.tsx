'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DashboardPageHeader,
  DashboardPanel,
  DataToolbar,
  EmptyState,
  MetricCard,
} from '@/components/dashboard'
import { ConsultationServiceForm } from '@/components/teknisi/consultation-service-form'
import { useTeknisiProfile } from '@/hooks/use-teknisi-profile'
import {
  emptyConsultationService,
  type ProfileConsultationService,
} from '@/lib/teknisi-profile-content'
import {
  CheckCircle,
  Clock,
  Edit,
  ExternalLink,
  Laptop,
  MessageSquare,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from '@/lib/icons'
import { DataPagination } from '@/components/ui/data-pagination'
import { useClientPagination } from '@/hooks/use-client-pagination'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)

function resolveServicePrice(svc: ProfileConsultationService, basePrice: number) {
  return svc.price ?? basePrice
}

function normalizeService(s: ProfileConsultationService): ProfileConsultationService {
  return {
    name: s.name.trim(),
    description: s.description.trim(),
    duration: s.duration.trim() || '30 menit',
    price: s.price,
    popular: s.popular,
    requiresRemote: s.requiresRemote,
  }
}

/** `null` = tutup, `-1` = tambah baru, `>= 0` = edit indeks layanan */
type EditorTarget = number | null

export function TeknisiIklanKonsultasiView() {
  const { profile, loading, error, reload, setProfile } = useTeknisiProfile()
  const [searchQuery, setSearchQuery] = useState('')
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(null)
  const [draft, setDraft] = useState<ProfileConsultationService>(emptyConsultationService(0))
  const [basePrice, setBasePrice] = useState('0')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const scrollToEditor = useCallback(() => {
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const openCreate = useCallback(() => {
    if (!profile) return
    const base = profile.price
    setBasePrice(String(base))
    setDraft(emptyConsultationService(base))
    setEditorTarget(-1)
    setFormError(null)
    scrollToEditor()
  }, [profile, scrollToEditor])

  const openEdit = useCallback(
    (index: number) => {
      if (!profile) return
      setBasePrice(String(profile.price))
      setDraft({ ...profile.consultationServices[index]! })
      setEditorTarget(index)
      setFormError(null)
      scrollToEditor()
    },
    [profile, scrollToEditor],
  )

  const closeEditor = useCallback(() => {
    setEditorTarget(null)
    setFormError(null)
  }, [])

  const filteredItems = useMemo(() => {
    if (!profile) return []
    const q = searchQuery.trim().toLowerCase()
    return profile.consultationServices
      .map((svc, index) => ({ svc, index }))
      .filter(
        ({ svc }) =>
          !q ||
          svc.name.toLowerCase().includes(q) ||
          svc.description.toLowerCase().includes(q),
      )
  }, [profile, searchQuery])

  const { page, setPage, pageSize, setPageSize, paginatedItems, totalItems } =
    useClientPagination(filteredItems, [searchQuery, profile?.consultationServices])

  const stats = useMemo(() => {
    if (!profile) {
      return { total: 0, popular: 0, remote: 0, base: 0 }
    }
    const list = profile.consultationServices
    return {
      total: list.length,
      popular: list.filter((s) => s.popular).length,
      remote: list.filter((s) => s.requiresRemote).length,
      base: profile.price,
    }
  }, [profile])

  const isCreating = editorTarget === -1
  const isEditing = editorTarget !== null && editorTarget >= 0

  const persistServices = async (
    nextServices: ProfileConsultationService[],
    nextBasePrice: number,
  ) => {
    const normalized = nextServices.map(normalizeService).filter((s) => s.name)

    const res = await fetch('/api/teknisi/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultationServices: normalized,
        price: nextBasePrice,
      }),
    })
    const data = await res.json()
    if (!data.success) {
      setFormError(data.error || 'Gagal menyimpan layanan')
      return false
    }
    setProfile(data.data)
    closeEditor()
    return true
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || editorTarget === null) return

    const normalizedDraft = normalizeService(draft)
    if (!normalizedDraft.name) {
      setFormError('Nama layanan wajib diisi')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      const nextBase = Number(basePrice) || 0
      const current = profile.consultationServices.map((s) => ({ ...s }))

      if (isCreating) {
        await persistServices([...current, normalizedDraft], nextBase)
      } else if (isEditing) {
        current[editorTarget] = normalizedDraft
        await persistServices(current, nextBase)
      }
    } catch {
      setFormError('Gagal menyimpan layanan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!profile || !isEditing) return
    if (!confirm(`Hapus layanan "${draft.name}"?`)) return

    setSaving(true)
    setFormError(null)
    try {
      const next = profile.consultationServices.filter((_, i) => i !== editorTarget)
      await persistServices(next, Number(basePrice) || profile.price)
    } catch {
      setFormError('Gagal menghapus layanan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-surface-500">Memuat iklan konsultasi…</p>
  }

  if (error || !profile) {
    return (
      <div className="space-y-3 py-8 text-center">
        <p className="text-sm text-rose-600">{error ?? 'Profil tidak tersedia'}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
          Coba lagi
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6 pb-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <DashboardPageHeader
        title="Iklan Konsultasi"
        description="Kelola paket konsultasi yang tampil di profil publik dan menu pemesanan user."
        actions={
          <div className="flex flex-wrap gap-2 self-start">
            <Link href={`/teknisi/${profile.userId}`} target="_blank">
              <Button variant="outline" size="sm" className="h-8 gap-1 px-3 text-[11px]">
                <ExternalLink className="h-3.5 w-3.5" />
                Lihat Profil
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              className="h-8 gap-1 px-3 text-[11px]"
              onClick={() => {
                if (editorTarget !== null) closeEditor()
                else openCreate()
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              {editorTarget !== null ? 'Tutup Form' : 'Tambah Layanan'}
            </Button>
          </div>
        }
        meta={
          <motion.div className="flex flex-wrap items-center gap-2 text-xs text-surface-500">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary-200/70 bg-primary-50 px-2.5 py-1 font-medium text-primary-800">
              <CheckCircle className="h-3.5 w-3.5 text-primary-600" />
              {stats.total} paket aktif
            </span>
            {stats.popular > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
                <Star className="h-3.5 w-3.5" />
                {stats.popular} populer
              </span>
            )}
            {stats.remote > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent-200/70 bg-accent-50 px-2.5 py-1 font-medium text-accent-800">
                <Laptop className="h-3.5 w-3.5" />
                {stats.remote} dengan remote
              </span>
            )}
          </motion.div>
        }
      />

      {editorTarget !== null && (
        <div ref={editorRef} className="scroll-mt-24">
          <DashboardPanel
            title={isCreating ? 'Tambah Layanan Konsultasi' : `Edit: ${draft.name || 'Layanan'}`}
            description={
              isCreating
                ? 'Buat paket konsultasi baru untuk ditampilkan di profil publik.'
                : 'Perbarui detail paket ini. Perubahan langsung tercermin di profil publik setelah disimpan.'
            }
          >
            <form className="space-y-5" onSubmit={handleSave}>
              {formError && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</p>
              )}

              <div className="max-w-xs">
                <label className="mb-1 block text-sm font-medium text-surface-700">
                  Harga dasar (Rp)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-surface-500">
                  Fallback jika harga layanan dikosongkan.
                </p>
              </div>

              <ConsultationServiceForm
                value={draft}
                basePrice={Number(basePrice) || 0}
                onChange={setDraft}
                idPrefix={isCreating ? 'create' : `edit-${editorTarget}`}
              />

              <div className="flex flex-wrap gap-2 border-t border-surface-100 pt-4">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Menyimpan…' : isCreating ? 'Tambah Layanan' : 'Simpan Perubahan'}
                </Button>
                <Button type="button" variant="outline" onClick={closeEditor} disabled={saving}>
                  Batal
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    className="ml-auto gap-1 text-rose-600 hover:bg-rose-50"
                    disabled={saving}
                    onClick={() => void handleDelete()}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus layanan
                  </Button>
                )}
              </div>
            </form>
          </DashboardPanel>
        </div>
      )}

      <motion.div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          title="Total Paket"
          value={String(stats.total)}
          footnote={stats.total > 0 ? 'Tampil di profil publik' : 'Belum ada paket'}
          icon={MessageSquare}
          tone="primary"
          compact
        />
        <MetricCard
          title="Harga Dasar"
          value={formatPrice(stats.base)}
          footnote="Fallback jika harga layanan kosong"
          icon={Sparkles}
          tone="neutral"
          compact
        />
        <MetricCard
          title="Layanan Remote"
          value={String(stats.remote)}
          footnote={
            stats.remote > 0 ? 'Membutuhkan IndoDesk saat booking' : 'Belum ada paket remote'
          }
          icon={Laptop}
          tone={stats.remote > 0 ? 'primary' : 'neutral'}
          compact
        />
      </motion.div>

      <DataToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Cari layanan konsultasi..."
        resultLabel={`${totalItems} layanan`}
      />

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Belum ada layanan konsultasi"
          description="Tambahkan paket konsultasi agar user bisa memesan dari profil publik Anda."
          action={
            <Button variant="primary" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Layanan
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {paginatedItems.map(({ svc, index: serviceIndex }, index) => {
            const price = resolveServicePrice(svc, profile.price)
            const isActive = editorTarget === serviceIndex
            return (
              <motion.div
                key={`${svc.name}-${serviceIndex}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Card
                  className={
                    isActive
                      ? 'overflow-hidden ring-2 ring-primary-300'
                      : 'overflow-hidden transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-soft-md'
                  }
                >
                  <CardContent className="flex items-stretch gap-3 p-3 sm:p-4">
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/80 text-primary-700 sm:h-24 sm:w-24">
                      <MessageSquare className="h-8 w-8" />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          {svc.popular && (
                            <Badge variant="warning" className="rounded-full px-2 py-0 text-[9px]">
                              Populer
                            </Badge>
                          )}
                          {svc.requiresRemote && (
                            <Badge
                              variant="outline"
                              className="rounded-full border-accent-200/70 bg-accent-50 px-2 py-0 text-[9px] text-accent-800"
                            >
                              Remote
                            </Badge>
                          )}
                          {isActive && (
                            <Badge variant="default" className="rounded-full px-2 py-0 text-[9px]">
                              Sedang diedit
                            </Badge>
                          )}
                        </div>
                        <h3 className="line-clamp-1 text-[13px] font-semibold text-ink">{svc.name}</h3>
                        <p className="mt-0.5 text-[14px] font-bold text-primary-700">
                          {formatPrice(price)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-surface-500">
                          {svc.description || '—'}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-surface-500">
                          <span className="inline-flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {svc.duration || '30 menit'}
                          </span>
                          {svc.price == null && (
                            <>
                              <span className="text-surface-300">·</span>
                              <span>Menggunakan harga dasar</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="mt-2">
                        <Button
                          type="button"
                          variant={isActive ? 'primary' : 'outline'}
                          size="sm"
                          className="h-7 gap-1 px-2 text-[10px]"
                          onClick={() => {
                            if (isActive) closeEditor()
                            else openEdit(serviceIndex)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                          {isActive ? 'Tutup' : 'Edit'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {totalItems > pageSize && (
        <DataPagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          className="mt-4"
        />
      )}
    </motion.div>
  )
}
