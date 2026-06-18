import { prisma } from '@/lib/db'

export async function processRekberComplaintDeadlines(): Promise<{ escalated: number }> {
  const now = new Date()
  const overdue = await prisma.rekberComplaint.findMany({
    where: {
      status: 'OPEN',
      sellerDeadline: { lt: now },
    },
    select: { id: true },
    take: 50,
  })

  if (overdue.length === 0) return { escalated: 0 }

  await prisma.rekberComplaint.updateMany({
    where: { id: { in: overdue.map((r) => r.id) } },
    data: { status: 'ESCALATED', escalatedAt: now },
  })

  return { escalated: overdue.length }
}
