'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { TeknisiAccountProfileDto } from '@/lib/teknisi-profile-serializer'
import type { TeknisiProfileEditSection } from '@/lib/teknisi-profile-edit-sections'
import { PROFILE_EDIT_SECTION_LABELS } from '@/lib/teknisi-profile-edit-sections'
import { TeknisiProfileEditDialog } from '@/components/teknisi/teknisi-profile-edit-dialog'
import { TeknisiProfileForm, type TeknisiProfileFormSection } from '@/components/teknisi/teknisi-profile-form'
import { TeknisiProfileJadwalForm } from '@/components/teknisi/teknisi-profile-jadwal-form'
import { TeknisiPortfolioSection } from '@/components/teknisi/teknisi-portfolio-section'
import { TeknisiCertificationSection } from '@/components/teknisi/teknisi-certification-section'
import { TeknisiProfileServicesForm } from '@/components/teknisi/teknisi-profile-services-form'

const SECTION_TO_FORM: Partial<Record<TeknisiProfileEditSection, TeknisiProfileFormSection>> = {
  hero: 'hero',
  about: 'about',
  skills: 'skills',
}

const DIALOG_SIZE: Partial<Record<TeknisiProfileEditSection, 'md' | 'lg' | 'xl'>> = {
  hero: 'lg',
  about: 'lg',
  skills: 'md',
  services: 'xl',
  portfolio: 'xl',
  jadwal: 'lg',
  certifications: 'xl',
}

type TeknisiProfileInlineEditHostProps = {
  activeSection: TeknisiProfileEditSection | null
  onSectionChange: (section: TeknisiProfileEditSection | null) => void
  onPublicRefresh: () => Promise<void>
}

export function TeknisiProfileInlineEditHost({
  activeSection,
  onSectionChange,
  onPublicRefresh,
}: TeknisiProfileInlineEditHostProps) {
  const { update } = useSession()
  const [profile, setProfile] = useState<TeknisiAccountProfileDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/teknisi/profile')
      const data = await res.json()
      if (!data.success) {
        setLoadError(data.error || 'Gagal memuat profil')
        return null
      }
      setProfile(data.data)
      return data.data as TeknisiAccountProfileDto
    } catch {
      setLoadError('Gagal memuat profil')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!activeSection) return
    if (profile) return
    void loadProfile()
  }, [activeSection, profile, loadProfile])

  useEffect(() => {
    if (!activeSection) setProfile(null)
  }, [activeSection])

  const handleClose = () => {
    onSectionChange(null)
    void onPublicRefresh()
  }

  const handleSaved = async (next: TeknisiAccountProfileDto) => {
    setProfile(next)
    void update({ name: next.name, image: next.image ?? undefined })
    await onPublicRefresh()
    onSectionChange(null)
  }

  const handleFormSaved = (next: TeknisiAccountProfileDto) => {
    void handleSaved(next)
  }

  const formSection = activeSection ? SECTION_TO_FORM[activeSection] : undefined

  return (
    <TeknisiProfileEditDialog
      open={Boolean(activeSection)}
      title={activeSection ? PROFILE_EDIT_SECTION_LABELS[activeSection] : ''}
      onClose={handleClose}
      size={activeSection ? DIALOG_SIZE[activeSection] : 'lg'}
    >
      {loading && !profile ? (
        <p className="py-8 text-center text-sm text-surface-500">Memuat data profil…</p>
      ) : loadError && !profile ? (
        <div className="space-y-3 py-6 text-center">
          <p className="text-sm text-rose-600">{loadError}</p>
          <button
            type="button"
            className="text-sm font-medium text-primary-700 hover:underline"
            onClick={() => void loadProfile()}
          >
            Coba lagi
          </button>
        </div>
      ) : profile && activeSection === 'services' ? (
        <TeknisiProfileServicesForm
          profile={profile}
          onSaved={handleFormSaved}
          onClose={handleClose}
        />
      ) : profile && activeSection === 'jadwal' ? (
        <TeknisiProfileJadwalForm
          profile={profile}
          onSaved={(next) => {
            setProfile(next)
            void handleSaved(next)
          }}
        />
      ) : profile && activeSection === 'portfolio' ? (
        <TeknisiPortfolioSection />
      ) : profile && activeSection === 'certifications' ? (
        <TeknisiCertificationSection />
      ) : profile && formSection ? (
        <TeknisiProfileForm
          profile={profile}
          section={formSection}
          onSaved={handleFormSaved}
          onSessionUpdate={(name, image) => void update({ name, image })}
          onCancel={handleClose}
        />
      ) : null}
    </TeknisiProfileEditDialog>
  )
}
