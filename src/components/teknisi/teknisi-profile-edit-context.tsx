'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { TeknisiProfileEditSection } from '@/lib/teknisi-profile-edit-sections'
import { OwnerEditButton } from '@/components/teknisi/owner-edit-button'
import { PROFILE_EDIT_SECTION_LABELS } from '@/lib/teknisi-profile-edit-sections'

type ProfileEditContextValue = {
  isOwner: boolean
  openEdit: (section: TeknisiProfileEditSection) => void
}

const ProfileEditContext = createContext<ProfileEditContextValue | null>(null)

export function TeknisiProfileEditProvider({
  isOwner,
  openEdit,
  children,
}: {
  isOwner: boolean
  openEdit: (section: TeknisiProfileEditSection) => void
  children: ReactNode
}) {
  return (
    <ProfileEditContext.Provider value={{ isOwner, openEdit }}>
      {children}
    </ProfileEditContext.Provider>
  )
}

export function useTeknisiProfileEdit() {
  return useContext(ProfileEditContext)
}

export function ProfileSectionEditButton({
  section,
  className,
}: {
  section: TeknisiProfileEditSection
  className?: string
}) {
  const ctx = useTeknisiProfileEdit()
  if (!ctx?.isOwner) return null

  const label = `Edit ${PROFILE_EDIT_SECTION_LABELS[section]}`
  return (
    <OwnerEditButton
      label={label}
      className={className}
      onClick={() => ctx.openEdit(section)}
    />
  )
}
