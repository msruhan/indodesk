import { prisma } from '@/lib/db'
import { categoryLabel } from '@/lib/product-catalog'
import { dispatchTelegramEvent } from '@/lib/telegram/dispatch'
import { formatIdr } from '@/lib/format'

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
}

export async function notifyProductPublished(productId: string): Promise<void> {
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
  if (!product || product.listingStatus !== 'APPROVED' || !product.isPublished) return

  const base = appBaseUrl()
  await dispatchTelegramEvent('product.published', {
    vars: {
      namaProduk: product.name,
      harga: formatIdr(Number(product.price)),
      kategori: categoryLabel(product.category),
      namaToko: product.seller.teknisiStore?.name ?? product.seller.name ?? 'Toko',
      namaTeknisi: product.seller.name ?? 'Teknisi',
      linkProduk: `${base}/marketplace/products/${product.id}`,
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

export async function notifyMarketplaceOrderNew(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { name: true } },
      items: { take: 1, include: { product: { select: { name: true } } } },
    },
  })
  if (!order) return

  const base = appBaseUrl()
  await dispatchTelegramEvent('marketplace.order.new', {
    teknisiUserId: order.sellerId,
    vars: {
      kodeOrder: order.orderCode,
      namaProduk: order.items[0]?.product.name ?? 'Produk',
      namaPembeli: order.buyer.name ?? 'Pembeli',
      total: formatIdr(Number(order.total)),
      jumlahItem: String(order.items.length),
      metodeBayar: 'wallet',
      linkPesanan: `${base}/teknisi/pesanan`,
    },
  })
}

/** Hanya pada transisi status → PAID (bukan create langsung PAID). */
export async function notifyMarketplaceOrderPaid(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { name: true } },
      items: { take: 1, include: { product: { select: { name: true } } } },
    },
  })
  if (!order || order.status !== 'PAID') return

  const base = appBaseUrl()
  await dispatchTelegramEvent('marketplace.order.paid', {
    teknisiUserId: order.sellerId,
    vars: {
      kodeOrder: order.orderCode,
      namaProduk: order.items[0]?.product.name ?? 'Produk',
      namaPembeli: order.buyer.name ?? 'Pembeli',
      total: formatIdr(Number(order.total)),
      jumlahItem: String(order.items.length),
      metodeBayar: 'wallet',
      linkPesanan: `${base}/teknisi/pesanan`,
    },
  })
}

export async function notifyKonsultasiNew(sessionId: string): Promise<void> {
  const row = await prisma.konsultasiSession.findUnique({
    where: { id: sessionId },
    include: { user: { select: { name: true } } },
  })
  if (!row || row.status !== 'PENDING') return

  const base = appBaseUrl()
  await dispatchTelegramEvent('konsultasi.new', {
    teknisiUserId: row.teknisiId,
    vars: {
      namaUser: row.user.name ?? 'Pelanggan',
      layanan: row.service,
      kodeSesi: row.id,
      remoteId: row.remoteId ?? '',
      linkDashboard: `${base}/teknisi/konsultasi`,
    },
  })
}

export async function notifyInspeksiNew(orderId: string): Promise<void> {
  const row = await prisma.inspectionOrder.findUnique({
    where: { id: orderId },
    include: { user: { select: { name: true } } },
  })
  if (!row) return

  const base = appBaseUrl()
  const modeLabel = row.mode === 'ONLINE' ? 'online' : 'offline'
  await dispatchTelegramEvent('inspeksi.new', {
    teknisiUserId: row.teknisiId,
    vars: {
      namaUser: row.user.name ?? 'Pelanggan',
      namaProduk: row.productName,
      mode: modeLabel,
      kodeOrder: row.orderCode,
      linkDashboard: `${base}/teknisi/inspeksi`,
    },
  })
}
