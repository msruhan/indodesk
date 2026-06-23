export type TeknisiProfileEditSection =
  | 'hero'
  | 'about'
  | 'skills'
  | 'services'
  | 'portfolio'
  | 'jadwal'
  | 'certifications'

export const TEKNISI_PROFILE_EDIT_SECTIONS: TeknisiProfileEditSection[] = [
  'hero',
  'about',
  'skills',
  'services',
  'portfolio',
  'jadwal',
  'certifications',
]

export function isTeknisiProfileEditSection(value: string | null): value is TeknisiProfileEditSection {
  return TEKNISI_PROFILE_EDIT_SECTIONS.includes(value as TeknisiProfileEditSection)
}

export const PROFILE_EDIT_SECTION_LABELS: Record<TeknisiProfileEditSection, string> = {
  hero: 'Identitas & Banner',
  about: 'Tentang Teknisi',
  skills: 'Keahlian & kompetensi',
  services: 'Layanan Konsultasi',
  portfolio: 'Portofolio',
  jadwal: 'Jadwal Ketersediaan',
  certifications: 'Sertifikasi',
}
