import 'server-only'

import { prisma } from '@/lib/db'
import { categoryLabel } from '@/lib/product-catalog'
import {
  getPrimaryProductImageUrl,
  parseProductImagesField,
} from '@/lib/product-images'
import { parseCompletenessJson } from '@/lib/product-specs'
import {
  type TeknisiApplicationData,
} from '@/lib/teknisi-registration'
import {
  formatOperatingHoursLines,
  operatingHoursFromDb,
} from '@/lib/store-operating-hours'
import type { ApprovalEntityType } from '@/lib/approval-queue'
import type {
  ApprovalDetail,
  ApprovalProductDetail,
  ApprovalStoreDetail,
  ApprovalTeknisiDetail,
} from '@/lib/approval-detail-types'

export type {
  ApprovalDetail,
  ApprovalProductDetail,
  ApprovalStoreDetail,
  ApprovalTeknisiDetail,
} from '@/lib/approval-detail-types'

export async function loadApprovalDetail(
  entityType: ApprovalEntityType,
  id: string,
): Promise<ApprovalDetail | null> {
  if (entityType === 'product') {
    const p = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            teknisiStore: { select: { name: true } },
          },
        },
      },
    })
    if (!p) return null
    const images = parseProductImagesField(p)
    return {
      entityType: 'product',
      id: p.id,
      name: p.name,
      category: categoryLabel(p.category),
      categoryValue: p.category,
      price: Number(p.price),
      stock: p.stock,
      color: p.color,
      ram: p.ram,
      processor: p.processor,
      storage: p.storage,
      warranty: p.warranty,
      completeness: parseCompletenessJson(p.completeness, p.category),
      description: p.description,
      image: getPrimaryProductImageUrl(images, p.image),
      images,
      listingStatus: p.listingStatus,
      isPublished: p.isPublished,
      views: p.views,
      soldCount: p.soldCount,
      createdAt: p.createdAt.toISOString(),
      seller: {
        id: p.seller.id,
        name: p.seller.name,
        email: p.seller.email,
        storeName: p.seller.teknisiStore?.name ?? null,
      },
    }
  }

  if (entityType === 'store') {
    const s = await prisma.teknisiStore.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    if (!s) return null
    const hours = operatingHoursFromDb(s.operatingHours)
    return {
      entityType: 'store',
      id: s.id,
      name: s.name,
      city: s.city,
      address: s.address,
      phone: s.phone,
      email: s.email,
      instagram: s.instagram,
      threads: s.threads,
      tiktok: s.tiktok,
      coverImage: s.coverImage,
      gallery: s.gallery,
      layanan: s.layanan,
      operatingHoursLines: formatOperatingHoursLines(hours),
      journeyIntro: s.journeyIntro,
      listingStatus: s.listingStatus,
      isPublished: s.isPublished,
      profileViews: s.profileViews,
      totalSold: s.totalSold,
      createdAt: s.createdAt.toISOString(),
      owner: {
        id: s.user.id,
        name: s.user.name,
        email: s.user.email,
      },
    }
  }

  if (entityType === 'teknisi') {
    const t = await prisma.teknisiProfile.findUnique({
      where: { userId: id },
      include: { user: { select: { id: true, name: true, email: true, phone: true, image: true } } },
    })
    if (!t) return null
    const rawApp = t.applicationData
    const applicationData =
      rawApp && typeof rawApp === 'object' && !Array.isArray(rawApp)
        ? (rawApp as TeknisiApplicationData)
        : null
    return {
      entityType: 'teknisi',
      userId: t.userId,
      name: t.user.name,
      email: t.user.email,
      phone: t.user.phone,
      specialty: t.specialty,
      experience: t.experience,
      location: t.location,
      description: t.description,
      tagline: t.tagline,
      price: Number(t.price),
      coverImage: t.coverImage,
      avatar: t.user.image,
      isVerified: t.isVerified,
      verificationStatus: t.verificationStatus,
      rejectionReason: t.rejectionReason,
      applicationData,
      rating: Number(t.rating),
      reviewCount: t.reviewCount,
      createdAt: t.createdAt.toISOString(),
    }
  }

  return null
}
