import 'server-only'

import { prisma } from '@/lib/db'
import type { SupportTicketRelatedType, UserRole } from '@prisma/client'

export async function buildRelatedServiceSnapshot(
  userId: string,
  role: UserRole,
  relatedType: SupportTicketRelatedType,
  relatedId: string,
): Promise<Record<string, unknown> | null> {
  if (relatedType === 'OTHER') return null

  switch (relatedType) {
    case 'KONSULTASI': {
      const row = await prisma.konsultasiSession.findUnique({
        where: { id: relatedId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          teknisi: { select: { id: true, name: true, email: true } },
        },
      })
      if (!row) return null
      return {
        type: 'KONSULTASI',
        id: row.id,
        status: row.status,
        service: row.service,
        device: row.device,
        clientOs: row.clientOs,
        note: row.note,
        requiresRemote: row.requiresRemote,
        remoteId: row.remoteId,
        paymentStatus: row.paymentStatus,
        user: row.user,
        teknisi: row.teknisi,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        viewerRole: role,
        viewerId: userId,
      }
    }
    case 'REMOTE': {
      const row = await prisma.remoteSession.findUnique({
        where: { id: relatedId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          teknisi: { select: { id: true, name: true, email: true } },
        },
      })
      if (!row) return null
      return {
        type: 'REMOTE',
        id: row.id,
        status: row.status,
        remoteId: row.remoteId,
        platform: row.platform,
        description: row.description,
        user: row.user,
        teknisi: row.teknisi,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    }
    case 'INSPEKSI': {
      const row = await prisma.inspectionOrder.findUnique({
        where: { id: relatedId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          teknisi: { select: { id: true, name: true, email: true } },
        },
      })
      if (!row) return null
      return {
        type: 'INSPEKSI',
        id: row.id,
        orderCode: row.orderCode,
        status: row.status,
        mode: row.mode,
        category: row.category,
        productName: row.productName,
        productBrand: row.productBrand,
        productModel: row.productModel,
        notes: row.notes,
        location: row.location,
        city: row.city,
        user: row.user,
        teknisi: row.teknisi,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    }
    case 'MARKETPLACE_ORDER': {
      const row = await prisma.order.findUnique({
        where: { id: relatedId },
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          seller: { select: { id: true, name: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      })
      if (!row) return null
      return {
        type: 'MARKETPLACE_ORDER',
        id: row.id,
        orderCode: row.orderCode,
        status: row.status,
        total: row.total.toString(),
        trackingNumber: row.trackingNumber,
        shippingCourier: row.shippingCourier,
        buyer: row.buyer,
        seller: row.seller,
        products: row.items.map((i) => i.product.name),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    }
    default:
      return null
  }
}
