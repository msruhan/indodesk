import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { getPublicFeatureFlags } from '@/lib/platform-settings'
import { normalizeProfileContentForDb } from '@/lib/teknisi-profile-content'
import { loadTeknisiAccountProfile } from '@/lib/teknisi-profile-serializer'
import {
  normalizeShipOriginCouriers,
  validateShipOriginCouriers,
} from '@/lib/shipping-config'

export const dynamic = 'force-dynamic'

const consultationServiceSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  duration: z.string().max(40).optional(),
  price: z.number().int().min(0).nullable().optional(),
  popular: z.boolean().optional(),
  requiresRemote: z.boolean().optional(),
})

const patchSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(120).optional(),
  phone: z.string().max(30).nullable().optional(),
  experience: z.string().max(80).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  shipOriginCityId: z.string().max(64).nullable().optional(),
  shipOriginCityLabel: z.string().max(200).nullable().optional(),
  shipOriginDistrictId: z.string().max(64).nullable().optional(),
  shipOriginDistrictLabel: z.string().max(200).nullable().optional(),
  shipOriginLocationId: z.string().max(64).nullable().optional(),
  shipOriginLocationLabel: z.string().max(200).nullable().optional(),
  shipOriginStreet: z.string().max(300).nullable().optional(),
  shipOriginCouriers: z.array(z.string().min(2).max(16)).max(6).optional(),
  description: z.string().max(5000).nullable().optional(),
  tagline: z.string().max(500).nullable().optional(),
  issuesHandled: z.string().max(500).nullable().optional(),
  brandFocus: z.string().max(500).nullable().optional(),
  workApproach: z.string().max(500).nullable().optional(),
  price: z.number().int().min(0).optional(),
  specialty: z.array(z.string().min(1).max(60)).max(20).optional(),
  serviceScope: z.array(z.string().min(1).max(200)).max(12).optional(),
  languages: z.array(z.string().min(1).max(40)).max(8).optional(),
  secondarySkills: z.array(z.string().min(1).max(60)).max(16).optional(),
  operatingHours: z.record(z.string(), z.unknown()).optional(),
  consultationServices: z.array(consultationServiceSchema).max(12).optional(),
  providesInspection: z.boolean().optional(),
  inspectionPriceOnline: z.number().int().min(0).max(50_000_000).nullable().optional(),
  inspectionPriceOffline: z.number().int().min(0).max(50_000_000).nullable().optional(),
  isProfileHidden: z.boolean().optional(),
})

export async function GET() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const data = await loadTeknisiAccountProfile(session.user.id)
    if (!data) return apiError('Profil teknisi tidak ditemukan', 404)
    return apiSuccess(data)
  } catch (e) {
    console.error('[TEKNISI_PROFILE_GET]', e)
    return apiError('Gagal mengambil profil', 500)
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { teknisiProfile: true },
    })
    if (!existing?.teknisiProfile) {
      return apiError('Profil teknisi tidak ditemukan', 404)
    }

    const data = parsed.data
  const {
    name,
    phone,
    experience,
    location,
    shipOriginCityId,
    shipOriginCityLabel,
    shipOriginDistrictId,
    shipOriginDistrictLabel,
    shipOriginLocationId,
    shipOriginLocationLabel,
    shipOriginStreet,
    shipOriginCouriers,
    description,
    tagline,
    issuesHandled,
    brandFocus,
    workApproach,
    price,
    specialty,
    serviceScope,
    languages,
    secondarySkills,
    operatingHours,
    consultationServices,
    providesInspection,
    inspectionPriceOnline,
    inspectionPriceOffline,
    isProfileHidden,
  } = data

    if (consultationServices !== undefined) {
      const flags = await getPublicFeatureFlags()
      if (!flags.konsultasiServiceEnabled) {
        return apiError('Layanan konsultasi sedang dinonaktifkan', 403)
      }
    }

    if (specialty !== undefined) {
      const normalized = specialty.map((s) => s.trim()).filter(Boolean)
      if (normalized.length === 0) {
        return apiError('Minimal satu spesialisasi utama')
      }
    }

    const hasShipOriginInput =
      shipOriginLocationId !== undefined ||
      shipOriginCityId !== undefined ||
      shipOriginCouriers !== undefined

    const resolvedShipOriginLocationId =
      shipOriginLocationId !== undefined
        ? shipOriginLocationId
        : existing.teknisiProfile.shipOriginLocationId

    let normalizedCouriers: string[] | undefined
    if (shipOriginCouriers !== undefined) {
      normalizedCouriers = normalizeShipOriginCouriers(shipOriginCouriers)
      const courierErr = validateShipOriginCouriers(normalizedCouriers, {
        requireAtLeastOne: Boolean(resolvedShipOriginLocationId),
      })
      if (courierErr) return apiError(courierErr)
    } else if (hasShipOriginInput && resolvedShipOriginLocationId) {
      const existingCouriers = normalizeShipOriginCouriers(
        existing.teknisiProfile.shipOriginCouriers,
      )
      const courierErr = validateShipOriginCouriers(existingCouriers, { requireAtLeastOne: true })
      if (courierErr) return apiError(courierErr)
    }

    const contentPatch = normalizeProfileContentForDb({
      tagline: tagline ?? undefined,
      issuesHandled: issuesHandled ?? undefined,
      brandFocus: brandFocus ?? undefined,
      workApproach: workApproach ?? undefined,
      serviceScope,
      languages,
      secondarySkills,
      operatingHours: operatingHours as never,
      consultationServices: consultationServices as never,
    })

    await prisma.$transaction(async (tx) => {
      if (name !== undefined || phone !== undefined) {
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            ...(name !== undefined ? { name: name.trim() } : {}),
            ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
          },
        })
      }

      await tx.teknisiProfile.update({
        where: { userId: session.user.id },
        data: {
          ...(experience !== undefined ? { experience: experience?.trim() || null } : {}),
          ...(location !== undefined ? { location: location?.trim() || null } : {}),
          ...(shipOriginCityId !== undefined ? { shipOriginCityId } : {}),
          ...(shipOriginCityLabel !== undefined ? { shipOriginCityLabel } : {}),
          ...(shipOriginDistrictId !== undefined ? { shipOriginDistrictId } : {}),
          ...(shipOriginDistrictLabel !== undefined ? { shipOriginDistrictLabel } : {}),
          ...(shipOriginLocationId !== undefined ? { shipOriginLocationId } : {}),
          ...(shipOriginLocationLabel !== undefined ? { shipOriginLocationLabel } : {}),
          ...(shipOriginStreet !== undefined ? { shipOriginStreet } : {}),
          ...(normalizedCouriers !== undefined ? { shipOriginCouriers: normalizedCouriers } : {}),
          ...(description !== undefined
            ? { description: description?.trim() || null }
            : {}),
          ...(price !== undefined ? { price } : {}),
          ...(specialty !== undefined
            ? { specialty: specialty.map((s) => s.trim()).filter(Boolean) }
            : {}),
          ...(tagline !== undefined ? { tagline: contentPatch.tagline } : {}),
          ...(issuesHandled !== undefined ? { issuesHandled: contentPatch.issuesHandled } : {}),
          ...(brandFocus !== undefined ? { brandFocus: contentPatch.brandFocus } : {}),
          ...(workApproach !== undefined ? { workApproach: contentPatch.workApproach } : {}),
          ...(serviceScope !== undefined ? { serviceScope: contentPatch.serviceScope ?? [] } : {}),
          ...(languages !== undefined ? { languages: contentPatch.languages ?? [] } : {}),
          ...(secondarySkills !== undefined
            ? { secondarySkills: contentPatch.secondarySkills ?? [] }
            : {}),
          ...(operatingHours !== undefined
            ? { operatingHours: contentPatch.operatingHours ?? {} }
            : {}),
          ...(consultationServices !== undefined
            ? { consultationServices: contentPatch.consultationServices ?? [] }
            : {}),
          ...(providesInspection !== undefined ? { providesInspection } : {}),
          ...(inspectionPriceOnline !== undefined ? { inspectionPriceOnline } : {}),
          ...(inspectionPriceOffline !== undefined ? { inspectionPriceOffline } : {}),
          ...(isProfileHidden !== undefined ? { isProfileHidden } : {}),
        },
      })
    })

    const result = await loadTeknisiAccountProfile(session.user.id)
    if (!result) return apiError('Profil teknisi tidak ditemukan', 404)
    return apiSuccess(result)
  } catch (e) {
    console.error('[TEKNISI_PROFILE_PATCH]', e)
    return apiError('Gagal memperbarui profil', 500)
  }
}
