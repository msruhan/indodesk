import type { TeknisiProductDto } from '@/lib/product-serializer'

export type ProductListingAction = 'wait' | 'edit_resubmit' | 'publish' | 'unpublish'

export type ProductListingUi = {
  reviewBadge: { label: string; variant: 'warning' | 'success' | 'danger' | 'outline' }
  visibilityLabel: string
  visibilityTone: 'primary' | 'neutral' | 'warning' | 'danger'
  action: ProductListingAction
  actionLabel: string
  actionDisabled: boolean
  actionHint: string
  showMarketplaceLink: boolean
}

/** Maps API product state to teknisi-facing review + visibility + primary action. */
export function resolveProductListingUi(product: TeknisiProductDto): ProductListingUi {
  if (product.status === 'pending') {
    return {
      reviewBadge: { label: 'Review admin', variant: 'warning' },
      visibilityLabel: 'Belum bisa ditampilkan — menunggu persetujuan admin',
      visibilityTone: 'warning',
      action: 'wait',
      actionLabel: 'Menunggu review',
      actionDisabled: true,
      actionHint: 'Admin akan meninjau iklan setelah Anda menyimpan produk baru atau mengubah konten iklan.',
      showMarketplaceLink: false,
    }
  }

  if (product.status === 'rejected') {
    return {
      reviewBadge: { label: 'Ditolak', variant: 'danger' },
      visibilityLabel: 'Tidak tampil di marketplace',
      visibilityTone: 'danger',
      action: 'edit_resubmit',
      actionLabel: 'Perbaiki & kirim ulang',
      actionDisabled: false,
      actionHint: 'Edit produk lalu simpan — permintaan review akan dikirim ulang ke admin.',
      showMarketplaceLink: false,
    }
  }

  if (product.isPublished) {
    return {
      reviewBadge: { label: 'Disetujui', variant: 'success' },
      visibilityLabel: 'Tampil di marketplace',
      visibilityTone: 'primary',
      action: 'unpublish',
      actionLabel: 'Sembunyikan',
      actionDisabled: false,
      actionHint: 'Iklan disembunyikan sementara. Klik untuk menampilkan kembali tanpa review admin.',
      showMarketplaceLink: true,
    }
  }

  return {
    reviewBadge: { label: 'Disetujui', variant: 'success' },
    visibilityLabel: 'Disembunyikan dari marketplace',
    visibilityTone: 'neutral',
    action: 'publish',
    actionLabel: 'Tampilkan di marketplace',
    actionDisabled: false,
    actionHint: 'Iklan disetujui admin tetapi sedang disembunyikan. Klik untuk menampilkan kembali.',
    showMarketplaceLink: false,
  }
}

export const PRODUCT_PUBLISH_FLOW_STEPS = [
  {
    step: '1',
    title: 'Buat & simpan iklan',
    body: 'Iklan baru masuk antrian review admin. Belum bisa ditampilkan di marketplace.',
  },
  {
    step: '2',
    title: 'Admin menyetujui',
    body: 'Setelah disetujui, iklan langsung tampil di marketplace. Menyembunyikan/menampilkan kembali tanpa edit konten tidak perlu review ulang.',
  },
  {
    step: '3',
    title: 'Setiap edit konten',
    body: 'Ubah nama, harga, foto, stok, atau deskripsi → iklan kembali ke review admin dan otomatis disembunyikan sampai disetujui lagi.',
  },
] as const
