import type { ProductListingStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  getPrimaryProductImageUrl,
  parseProductImagesField,
} from '@/lib/product-images'
import {
  formatApprovalDate,
  sortApprovalQueueItems,
  truncateText,
  type ApprovalEntityType,
  type ApprovalItemStatus,
  type ApprovalQueueItem,
  type ApprovalStats,
} from '@/lib/approval-queue'
import { notifyProductPublishedIfTransition } from '@/lib/telegram/notify'

export const dynamic = 'force-dynamic'

function listingToStatus(status: ProductListingStatus): ApprovalItemStatus {
  if (status === 'PENDING') return 'pending'
  if (status === 'APPROVED') return 'approved'
  return 'rejected'
}

async function loadQueue(): Promise<ApprovalQueueItem[]> {
  const [products, stores, teknisiProfiles] = await Promise.all([
    prisma.product.findMany({
      where: { listingStatus: { in: ['PENDING', 'APPROVED', 'REJECTED'] } },
      include: {
        seller: {
          select: {
            name: true,
            teknisiStore: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.teknisiStore.findMany({
      where: { listingStatus: { in: ['PENDING', 'APPROVED', 'REJECTED'] } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.teknisiProfile.findMany({
      where: {
        verificationStatus: { in: ['PENDING', 'APPROVED', 'REJECTED'] },
      },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const items: ApprovalQueueItem[] = []

  for (const p of products) {
    const images = parseProductImagesField(p)
    items.push({
      id: p.id,
      entityType: 'product',
      type: 'Produk',
      status: listingToStatus(p.listingStatus),
      name: p.name,
      submitter: p.seller.teknisiStore?.name ?? p.seller.name ?? 'Teknisi',
      description: truncateText(p.description),
      date: formatApprovalDate(p.createdAt),
      createdAt: p.createdAt.toISOString(),
      thumbnailUrl: getPrimaryProductImageUrl(images, p.image),
    })
  }

  for (const s of stores) {
    items.push({
      id: s.id,
      entityType: 'store',
      type: 'Toko',
      status: listingToStatus(s.listingStatus),
      name: s.name,
      submitter: s.user.name ?? 'Teknisi',
      description: truncateText([s.city, s.address].filter(Boolean).join(' · ') || 'Profil toko teknisi'),
      date: formatApprovalDate(s.createdAt),
      createdAt: s.createdAt.toISOString(),
      thumbnailUrl: s.coverImage,
    })
  }

  for (const t of teknisiProfiles) {
    const status: ApprovalItemStatus =
      t.verificationStatus === 'APPROVED'
        ? 'approved'
        : t.verificationStatus === 'REJECTED'
          ? 'rejected'
          : 'pending'
    items.push({
      id: t.userId,
      entityType: 'teknisi',
      type: 'Teknisi',
      status,
      name: t.user.name ?? 'Teknisi',
      submitter: t.user.name ?? 'Teknisi',
      description: truncateText(t.description ?? t.specialty.join(', ')),
      date: formatApprovalDate(t.createdAt),
      createdAt: t.createdAt.toISOString(),
    })
  }

  return sortApprovalQueueItems(items)
}

async function loadStats(): Promise<ApprovalStats> {
  const [
    pendingProducts,
    pendingStores,
    pendingTeknisi,
    approvedProducts,
    approvedStores,
    approvedTeknisi,
    rejectedProducts,
    rejectedStores,
    rejectedTeknisi,
  ] = await Promise.all([
    prisma.product.count({ where: { listingStatus: 'PENDING' } }),
    prisma.teknisiStore.count({ where: { listingStatus: 'PENDING' } }),
    prisma.teknisiProfile.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.product.count({ where: { listingStatus: 'APPROVED' } }),
    prisma.teknisiStore.count({ where: { listingStatus: 'APPROVED' } }),
    prisma.teknisiProfile.count({ where: { verificationStatus: 'APPROVED' } }),
    prisma.product.count({ where: { listingStatus: 'REJECTED' } }),
    prisma.teknisiStore.count({ where: { listingStatus: 'REJECTED' } }),
    prisma.teknisiProfile.count({ where: { verificationStatus: 'REJECTED' } }),
  ])

  return {
    pending: pendingProducts + pendingStores + pendingTeknisi,
    approved: approvedProducts + approvedStores + approvedTeknisi,
    rejected: rejectedProducts + rejectedStores + rejectedTeknisi,
  }
}

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const [items, stats] = await Promise.all([loadQueue(), loadStats()])
    return apiSuccess({ items, stats })
  } catch (e) {
    console.error('[ADMIN_APPROVAL_GET]', e)
    return apiError('Gagal memuat antrian approval', 500)
  }
}

export async function POST(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const entityType = body.entityType as ApprovalEntityType
    const id = String(body.id ?? '')
    const action = body.action as 'approve' | 'reject'

    if (!id || !['approve', 'reject'].includes(action)) {
      return apiError('Data tidak valid')
    }

    const nextStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

    if (entityType === 'product') {
      const product = await prisma.product.findUnique({ where: { id } })
      if (!product) return apiError('Produk tidak ditemukan', 404)
      if (product.listingStatus !== 'PENDING') {
        return apiError('Produk tidak dalam status menunggu approval')
      }
      await prisma.product.update({
        where: { id },
        data: {
          listingStatus: nextStatus as ProductListingStatus,
          isPublished: action === 'approve',
          pendingChangeSummary: null,
        },
      })
      if (action === 'approve') {
        void notifyProductPublishedIfTransition(id, product.isPublished)
      }
    } else if (entityType === 'store') {
      const store = await prisma.teknisiStore.findUnique({ where: { id } })
      if (!store) return apiError('Toko tidak ditemukan', 404)
      if (store.listingStatus !== 'PENDING') {
        return apiError('Toko tidak dalam status menunggu approval')
      }
      await prisma.teknisiStore.update({
        where: { id },
        data: {
          listingStatus: nextStatus as ProductListingStatus,
          isPublished: action === 'approve',
        },
      })
    } else if (entityType === 'teknisi') {
      const profile = await prisma.teknisiProfile.findUnique({ where: { userId: id } })
      if (!profile) return apiError('Profil teknisi tidak ditemukan', 404)
      if (profile.verificationStatus === 'APPROVED' && action === 'approve') {
        return apiError('Teknisi sudah diverifikasi')
      }
      if (profile.verificationStatus !== 'PENDING' && action === 'reject') {
        return apiError('Hanya pendaftaran menunggu yang dapat ditolak')
      }
      const rejectionReason =
        action === 'reject' ? String(body.rejectionReason ?? '').trim() || null : null
      await prisma.$transaction([
        prisma.teknisiProfile.update({
          where: { userId: id },
          data:
            action === 'approve'
              ? {
                  isVerified: true,
                  verificationStatus: 'APPROVED',
                  rejectionReason: null,
                }
              : {
                  isVerified: false,
                  verificationStatus: 'REJECTED',
                  rejectionReason,
                },
        }),
        ...(action === 'approve'
          ? [
              prisma.user.update({
                where: { id },
                data: { isActive: true },
              }),
            ]
          : []),
      ])
    } else {
      return apiError('Jenis entitas tidak dikenali')
    }

    const [items, stats] = await Promise.all([loadQueue(), loadStats()])
    return apiSuccess({ items, stats })
  } catch (e) {
    console.error('[ADMIN_APPROVAL_POST]', e)
    return apiError('Gagal memproses approval', 500)
  }
}
