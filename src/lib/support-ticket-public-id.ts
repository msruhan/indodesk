import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db'

export async function generateSupportTicketPublicId(): Promise<string> {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const prefix = `TKT-${y}${m}${d}`

  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = randomBytes(2).toString('hex').toUpperCase()
    const publicId = `${prefix}-${suffix}`
    const exists = await prisma.supportTicket.findUnique({
      where: { publicId },
      select: { id: true },
    })
    if (!exists) return publicId
  }

  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`
}
