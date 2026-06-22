import type { PrismaClient } from '@prisma/client'

const POST_IMAGES = {
  screen:
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
  repair:
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop',
  battery:
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
  board:
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop',
} as const

type SeedPostInput = {
  content: string
  videoUrl?: string | null
  publishedDaysAgo: number
  attachments?: Array<{
    type: 'image' | 'pdf'
    url: string
    fileName: string
    mimeType: string
    sortOrder: number
  }>
}

export const AHMAD_TEKNISI_POSTS: SeedPostInput[] = [
  {
    content:
      'Tips singkat sebelum beli HP second: cek IMEI di database resmi, uji semua tombol fisik, dan pastikan Face ID / fingerprint berfungsi normal. Kalau ragu, booking inspeksi dulu — lebih murah daripada zonk.',
    publishedDaysAgo: 1,
  },
  {
    content:
      'Baru selesai ganti LCD iPhone 13 Pro Max — hasil presisi, touch responsif, dan seal kembali rapat. Proses dokumentasi saya selalu foto before/after supaya customer tenang.',
    publishedDaysAgo: 3,
    attachments: [
      {
        type: 'image',
        url: POST_IMAGES.screen,
        fileName: 'lcd-iphone-before-after.jpg',
        mimeType: 'image/jpeg',
        sortOrder: 0,
      },
      {
        type: 'image',
        url: POST_IMAGES.repair,
        fileName: 'workbench-service.jpg',
        mimeType: 'image/jpeg',
        sortOrder: 1,
      },
    ],
  },
  {
    content:
      'Sharing video singkat alur unlock bootloader Android (edukasi dasar). Untuk device tertentu tetap butuh cek model & patch security — DM kalau butuh panduan spesifik per merek.',
    publishedDaysAgo: 5,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    content:
      'Kenapa saya sarankan rekber untuk transaksi HP second antar orang yang belum saling kenal? Karena dana baru cair setelah unit lolos inspeksi. Buyer aman, seller juga terlindungi dari chargeback seenaknya.',
    publishedDaysAgo: 8,
    attachments: [
      {
        type: 'image',
        url: POST_IMAGES.board,
        fileName: 'inspection-desk.jpg',
        mimeType: 'image/jpeg',
        sortOrder: 0,
      },
    ],
  },
  {
    content:
      'Gejala baterai mulai drop? Cek health battery dulu sebelum ganti sembarangan. Kadang masalah charging port atau IC pengisi daya, bukan sel baterai. Hemat biaya kalau diagnosa tepat di awal.',
    publishedDaysAgo: 12,
    attachments: [
      {
        type: 'image',
        url: POST_IMAGES.battery,
        fileName: 'battery-health-check.jpg',
        mimeType: 'image/jpeg',
        sortOrder: 0,
      },
    ],
  },
]

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(10, 30, 0, 0)
  return d
}

export async function seedTeknisiPostsForEmail(
  prisma: PrismaClient,
  email: string,
  posts: SeedPostInput[] = AHMAD_TEKNISI_POSTS,
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, role: true, name: true },
  })

  if (!user) {
    throw new Error(`User tidak ditemukan: ${email}`)
  }
  if (user.role !== 'TEKNISI') {
    throw new Error(`Akun ${email} bukan TEKNISI`)
  }

  await prisma.teknisiPost.deleteMany({ where: { teknisiId: user.id } })

  for (const post of posts) {
    const publishedAt = daysAgo(post.publishedDaysAgo)
    await prisma.teknisiPost.create({
      data: {
        teknisiId: user.id,
        content: post.content,
        videoUrl: post.videoUrl ?? null,
        publishedAt,
        updatedAt: publishedAt,
        attachments: post.attachments?.length
          ? {
              create: post.attachments.map((a) => ({
                type: a.type,
                url: a.url,
                fileName: a.fileName,
                mimeType: a.mimeType,
                sortOrder: a.sortOrder,
              })),
            }
          : undefined,
      },
    })
  }

  return posts.length
}
