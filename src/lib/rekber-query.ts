import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import {
  REKBER_BASE_INCLUDE,
  REKBER_INCLUDE,
  REKBER_LEGACY_SCALAR_SELECT,
} from '@/lib/rekber-includes'

type ListArgs = {
  where?: Prisma.RekberTransactionWhereInput
  orderBy?: Prisma.RekberTransactionOrderByWithRelationInput
  take?: number
}

export async function listRekberTransactions(args: ListArgs = {}) {
  const base = {
    where: args.where,
    orderBy: args.orderBy ?? { createdAt: 'desc' as const },
    ...(args.take != null ? { take: args.take } : {}),
  }

  try {
    return await prisma.rekberTransaction.findMany({
      ...base,
      include: REKBER_INCLUDE,
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    console.error('[listRekberTransactions] full include failed, retrying base include', detail, e)
  }

  try {
    return await prisma.rekberTransaction.findMany({
      ...base,
      include: REKBER_BASE_INCLUDE,
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    console.error('[listRekberTransactions] base include failed, retrying legacy select', detail, e)
  }

  return prisma.rekberTransaction.findMany({
    ...base,
    select: {
      ...REKBER_LEGACY_SCALAR_SELECT,
      buyer: REKBER_BASE_INCLUDE.buyer,
      seller: REKBER_BASE_INCLUDE.seller,
      inspectionOrder: REKBER_BASE_INCLUDE.inspectionOrder,
    },
  })
}
