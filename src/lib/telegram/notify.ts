import { prisma } from '@/lib/db'
import { categoryLabel } from '@/lib/product-catalog'
import { dispatchTelegramEvent } from '@/lib/telegram/dispatch'
import { resolveTelegramProductPhotoUrls } from '@/lib/telegram/product-photo-url'
import { formatIdr } from '@/lib/format'

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
}

/** Ringkas deskripsi produk agar caption Telegram tidak melebihi batas. */
function formatTelegramProductDescription(description: string | null | undefined): string {
  const text = description?.trim()
  if (!text) return '—'
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n')
  const max = 400
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max - 1)}…`
}

export async function notifyProductPublished(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: {
        select: {
          name: true,
          teknisiStore: { select: { name: true } },
          teknisiProfile: { select: { telegramUsername: true } },
        },
      },
    },
  })
  if (!product || product.listingStatus !== 'APPROVED' || !product.isPublished) return

  const tgUser = product.seller.teknisiProfile?.telegramUsername?.trim()
  const usernameTelegram = tgUser ? `@${tgUser.replace(/^@/, '')}` : '—'

  const base = appBaseUrl()
  const photoUrls = resolveTelegramProductPhotoUrls(product, base)

  await dispatchTelegramEvent('product.published', {
    photoUrls,
    vars: {
      namaProduk: product.name,
      harga: formatIdr(Number(product.price)),
      kategori: categoryLabel(product.category),
      deskripsiproduk: formatTelegramProductDescription(product.description),
      namaToko: product.seller.teknisiStore?.name ?? product.seller.name ?? 'Toko',
      namaTeknisi: product.seller.name ?? 'Teknisi',
      usernameTelegram,
      linkProduk: `${base}/marketplace/${product.id}`,
    },
  })
}

export async function notifyProductPublishedIfTransition(
  productId: string,
  wasPublished: boolean,
): Promise<void> {
  if (wasPublished) return
  await notifyProductPublished(productId)
}

export async function notifyAdminProductPendingApproval(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: {
        select: {
          name: true,
          teknisiStore: { select: { name: true } },
        },
      },
    },
  })
  if (!product || product.listingStatus !== 'PENDING') return

  const base = appBaseUrl()
  const photoUrls = resolveTelegramProductPhotoUrls(product, base)

  await dispatchTelegramEvent('admin.product.pending', {
    photoUrls,
    vars: {
      namaProduk: product.name,
      harga: formatIdr(Number(product.price)),
      kategori: categoryLabel(product.category),
      namaToko: product.seller.teknisiStore?.name ?? product.seller.name ?? 'Toko',
      namaTeknisi: product.seller.name ?? 'Teknisi',
      ringkasan: product.pendingChangeSummary?.trim() || 'Iklan produk menunggu tinjauan admin',
      linkDashboard: `${base}/admin/approval`,
    },
  })
}

export async function notifyAdminProductPendingIfTransition(
  productId: string,
  previousListingStatus: string,
): Promise<void> {
  if (previousListingStatus === 'PENDING') return
  await notifyAdminProductPendingApproval(productId)
}

export async function notifyMarketplaceOrderNew(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
      items: { take: 1, include: { product: { select: { name: true } } } },
    },
  })
  if (!order) return

  const base = appBaseUrl()
  const productName = order.items[0]?.product.name ?? 'Produk'
  const buyerName = order.buyer.name ?? 'Pembeli'
  const sellerName = order.seller.name ?? 'Penjual'
  const total = formatIdr(Number(order.total))

  await dispatchTelegramEvent('marketplace.order.new', {
    teknisiUserId: order.sellerId,
    vars: {
      kodeOrder: order.orderCode,
      namaProduk: productName,
      namaPembeli: buyerName,
      total,
      jumlahItem: String(order.items.length),
      metodeBayar: 'wallet',
      linkPesanan: `${base}/teknisi/pesanan`,
    },
  })

  await dispatchTelegramEvent('admin.marketplace.order.new', {
    vars: {
      kodeOrder: order.orderCode,
      namaProduk: productName,
      namaPembeli: buyerName,
      namaPenjual: sellerName,
      total,
      linkDashboard: `${base}/admin/transactions`,
    },
  })
}

/** Hanya pada transisi status → PAID (bukan create langsung PAID). */
export async function notifyMarketplaceOrderPaid(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
      items: { take: 1, include: { product: { select: { name: true } } } },
    },
  })
  if (!order || order.status !== 'PAID') return

  const base = appBaseUrl()
  const productName = order.items[0]?.product.name ?? 'Produk'
  const buyerName = order.buyer.name ?? 'Pembeli'
  const sellerName = order.seller.name ?? 'Penjual'
  const total = formatIdr(Number(order.total))

  await dispatchTelegramEvent('marketplace.order.paid', {
    teknisiUserId: order.sellerId,
    vars: {
      kodeOrder: order.orderCode,
      namaProduk: productName,
      namaPembeli: buyerName,
      total,
      jumlahItem: String(order.items.length),
      metodeBayar: 'wallet',
      linkPesanan: `${base}/teknisi/pesanan`,
    },
  })

  await dispatchTelegramEvent('admin.marketplace.order.paid', {
    vars: {
      kodeOrder: order.orderCode,
      namaProduk: productName,
      namaPembeli: buyerName,
      namaPenjual: sellerName,
      total,
      linkDashboard: `${base}/admin/transactions`,
    },
  })
}

export async function notifyKonsultasiNew(sessionId: string): Promise<void> {
  const row = await prisma.konsultasiSession.findUnique({
    where: { id: sessionId },
    include: {
      user: { select: { name: true } },
      teknisi: { select: { name: true } },
    },
  })
  if (!row || row.status !== 'PENDING') return

  const base = appBaseUrl()
  const userName = row.user.name ?? 'Pelanggan'
  const teknisiName = row.teknisi.name ?? 'Teknisi'

  await dispatchTelegramEvent('konsultasi.new', {
    teknisiUserId: row.teknisiId,
    vars: {
      namaUser: userName,
      layanan: row.service,
      kodeSesi: row.id,
      remoteId: row.remoteId ?? '',
      linkDashboard: `${base}/teknisi/konsultasi`,
    },
  })

  await dispatchTelegramEvent('admin.konsultasi.new', {
    vars: {
      namaUser: userName,
      namaTeknisi: teknisiName,
      layanan: row.service,
      kodeSesi: row.id,
      linkDashboard: `${base}/admin/monitoring?tab=konsultasi`,
    },
  })
}

export async function notifyInspeksiNew(orderId: string): Promise<void> {
  const row = await prisma.inspectionOrder.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true } },
      teknisi: { select: { name: true } },
    },
  })
  if (!row) return

  const base = appBaseUrl()
  const modeLabel = row.mode === 'ONLINE' ? 'online' : 'offline'
  const userName = row.user.name ?? 'Pelanggan'
  const teknisiName = row.teknisi.name ?? 'Teknisi'

  await dispatchTelegramEvent('inspeksi.new', {
    teknisiUserId: row.teknisiId,
    vars: {
      namaUser: userName,
      namaProduk: row.productName,
      mode: modeLabel,
      kodeOrder: row.orderCode,
      linkDashboard: `${base}/teknisi/inspeksi`,
    },
  })

  await dispatchTelegramEvent('admin.inspeksi.new', {
    vars: {
      namaUser: userName,
      namaTeknisi: teknisiName,
      namaProduk: row.productName,
      mode: modeLabel,
      kodeOrder: row.orderCode,
      linkDashboard: `${base}/admin/inspeksi`,
    },
  })
}

export async function notifyMarketplacePackagingSubmitted(orderId: string): Promise<void> {
  const proof = await prisma.orderPackagingProof.findUnique({
    where: { orderId },
    include: {
      order: { select: { orderCode: true, total: true } },
      seller: { select: { name: true } },
      media: { select: { id: true } },
    },
  })
  if (!proof || proof.status !== 'PENDING') return

  const base = appBaseUrl()
  const vars = {
    kodeOrder: proof.order.orderCode,
    namaPenjual: proof.seller.name ?? 'Penjual',
    total: formatIdr(Number(proof.order.total)),
    jumlahFile: String(proof.media.length),
    linkReview: `${base}/admin/marketplace-packaging`,
  }

  await dispatchTelegramEvent('marketplace.packaging.submitted', { vars })
  await dispatchTelegramEvent('admin.marketplace.packaging.submitted', { vars })
}

export async function notifyAdminUserRegistered(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true, role: true },
  })
  if (!user || user.role !== 'USER') return

  const base = appBaseUrl()
  await dispatchTelegramEvent('admin.user.registered', {
    vars: {
      namaUser: user.name,
      email: user.email,
      telepon: user.phone?.trim() || '—',
      linkDashboard: `${base}/admin/management`,
    },
  })
}

export async function notifyAdminTeknisiRegistered(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
      role: true,
      shippingCityLabel: true,
      teknisiProfile: { select: { location: true } },
    },
  })
  if (!user || user.role !== 'TEKNISI') return

  const base = appBaseUrl()
  const kota =
    user.shippingCityLabel?.trim() ||
    user.teknisiProfile?.location?.trim() ||
    '—'

  await dispatchTelegramEvent('admin.teknisi.registered', {
    vars: {
      namaTeknisi: user.name,
      email: user.email,
      telepon: user.phone?.trim() || '—',
      kota,
      linkDashboard: `${base}/admin/approval`,
    },
  })
}

function withdrawRoleLabel(role: string): string {
  switch (role) {
    case 'TEKNISI':
      return 'Teknisi'
    case 'USER':
      return 'User'
    case 'ADMIN':
      return 'Admin'
    default:
      return role
  }
}

export async function notifyAdminWithdrawRequest(requestId: string): Promise<void> {
  const row = await prisma.walletWithdrawRequest.findUnique({
    where: { id: requestId },
    include: { user: { select: { name: true, email: true, role: true } } },
  })
  if (!row) return

  const base = appBaseUrl()
  await dispatchTelegramEvent('admin.withdraw.request', {
    vars: {
      namaUser: row.user.name,
      role: withdrawRoleLabel(row.user.role),
      email: row.user.email,
      jumlah: formatIdr(Number(row.amount.toString())),
      bank: row.bankName,
      rekening: row.accountNumber,
      atasNama: row.accountHolder,
      riskScore: String(row.riskScore),
      linkDashboard: `${base}/admin/management?tab=saldo&subtab=withdraw`,
    },
  })
}
