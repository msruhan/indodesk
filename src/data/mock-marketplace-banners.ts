import type { MarketplaceBanner } from '@/lib/marketplace-banners'

export type { MarketplaceBanner } from '@/lib/marketplace-banners'

export const defaultMarketplaceBanners: MarketplaceBanner[] = [
  {
    id: '1',
    title: 'Promo Spesial Handphone',
    subtitle: 'Diskon hingga 30% untuk semua produk handphone',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1600&h=600&fit=crop',
    link: '/marketplace?category=handphone',
    buttonText: 'Beli sekarang',
    active: true,
    sortOrder: 1,
    placement: 'marketplace',
  },
  {
    id: '2',
    title: 'Laptop Terbaru 2024',
    subtitle: 'Koleksi laptop terbaru dengan harga terbaik',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1600&h=600&fit=crop',
    link: '/marketplace?category=laptop',
    buttonText: 'Lihat koleksi',
    active: true,
    sortOrder: 2,
    placement: 'marketplace',
  },
  {
    id: '3',
    title: 'Aksesoris Premium',
    subtitle: 'Lengkapi perangkat Anda dengan aksesoris berkualitas',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&h=600&fit=crop',
    link: '/shop?category=aksesoris',
    buttonText: 'Jelajahi',
    active: true,
    sortOrder: 3,
    placement: 'shop',
  },
  {
    id: '4',
    title: 'Software & Tools',
    subtitle: 'Tools profesional untuk teknisi handphone',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&h=600&fit=crop',
    link: '/shop?category=software',
    buttonText: 'Cek software',
    active: true,
    sortOrder: 4,
    placement: 'shop',
  },
]
