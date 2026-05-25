import type { JobType, Lowongan } from '@prisma/client'
import { formatNotificationTimeLabel } from '@/lib/notification-display'

export type JobTypeSlug = 'full-time' | 'part-time' | 'contract'

export type AdminLowonganDto = {
  id: string
  title: string
  company: string
  location: string
  salary: string | null
  type: JobTypeSlug
  typeLabel: string
  description: string
  requirements: string[]
  skills: string[]
  isActive: boolean
  applicants: number
  postedDate: string
  createdAt: string
}

export type PublicLowonganDto = {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  type: JobTypeSlug
  postedDate: string
  applicants: number
  description: string
  urgent?: boolean
  skills: string[]
}

export type PublicLowonganDetailDto = PublicLowonganDto & {
  requirements: string[]
}

const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
}

export function jobTypeToSlug(type: JobType): JobTypeSlug {
  if (type === 'PART_TIME') return 'part-time'
  if (type === 'CONTRACT') return 'contract'
  return 'full-time'
}

export function slugToJobType(slug: JobTypeSlug): JobType {
  if (slug === 'part-time') return 'PART_TIME'
  if (slug === 'contract') return 'CONTRACT'
  return 'FULL_TIME'
}

export function jobTypeLabel(type: JobType): string {
  return JOB_TYPE_LABELS[type] ?? type
}

export function parseListField(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30)
}

export function formatPostedDate(createdAt: Date): string {
  return formatNotificationTimeLabel(createdAt)
}

export function isUrgentListing(createdAt: Date): boolean {
  const days = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  return days <= 3
}

export function serializeAdminLowongan(
  row: Lowongan,
  applicants: number,
): AdminLowonganDto {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    salary: row.salary,
    type: jobTypeToSlug(row.type),
    typeLabel: jobTypeLabel(row.type),
    description: row.description,
    requirements: row.requirements,
    skills: row.skills,
    isActive: row.isActive,
    applicants,
    postedDate: row.createdAt.toISOString().slice(0, 10),
    createdAt: row.createdAt.toISOString(),
  }
}

export function serializePublicLowongan(
  row: Lowongan,
  applicants: number,
): PublicLowonganDto {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    salary: row.salary ?? undefined,
    type: jobTypeToSlug(row.type),
    postedDate: formatPostedDate(row.createdAt),
    applicants,
    description: row.description,
    urgent: isUrgentListing(row.createdAt),
    skills: row.skills,
  }
}

export function serializePublicLowonganDetail(
  row: Lowongan,
  applicants: number,
): PublicLowonganDetailDto {
  return {
    ...serializePublicLowongan(row, applicants),
    requirements: row.requirements,
  }
}
