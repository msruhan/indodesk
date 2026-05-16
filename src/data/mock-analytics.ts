/* =========================================================================
   Business-focused analytics mock data
   ========================================================================= */

/** Monthly platform revenue & transaction volume (Admin) */
export const revenueMonthly = [
  { month: 'Jan', revenue: 18.5, transactions: 420, orders: 312 },
  { month: 'Feb', revenue: 24.2, transactions: 580, orders: 445 },
  { month: 'Mar', revenue: 22.8, transactions: 510, orders: 398 },
  { month: 'Apr', revenue: 31.6, transactions: 720, orders: 562 },
  { month: 'Mei', revenue: 38.4, transactions: 890, orders: 701 },
  { month: 'Jun', revenue: 45.2, transactions: 1050, orders: 834 },
  { month: 'Jul', revenue: 52.1, transactions: 1240, orders: 978 },
]

/** Transaction mix by category (Admin donut) */
export const transactionMix = [
  { name: 'Marketplace', value: 42, color: '#10b981' },
  { name: 'Top Up', value: 28, color: '#06b6d4' },
  { name: 'Rekber', value: 16, color: '#8b5cf6' },
  { name: 'Konsultasi', value: 9, color: '#f59e0b' },
  { name: 'Remote', value: 5, color: '#ec4899' },
]

/** Funnel: views → wishlist → cart → order (Admin) */
export const conversionFunnel = [
  { stage: 'Lihat Iklan', value: 12400 },
  { stage: 'Wishlist', value: 3200 },
  { stage: 'Keranjang', value: 1850 },
  { stage: 'Order', value: 978 },
  { stage: 'Selesai', value: 834 },
]

/** Top selling products (Admin horizontal bar) */
export const topProducts = [
  { name: 'iPhone 13 Pro Max', sales: 124, revenue: 1054 },
  { name: 'Samsung S21 Ultra', sales: 98, revenue: 705 },
  { name: 'Konsultasi Unlock', sales: 234, revenue: 117 },
  { name: 'Remote Flashing', sales: 156, revenue: 234 },
  { name: 'Pulsa Telkomsel', sales: 312, revenue: 156 },
  { name: 'ML Diamonds 518', sales: 189, revenue: 247 },
]

/** Weekly earnings for teknisi */
export const teknisiEarningsWeekly = [
  { week: 'Mg 1', earnings: 850, consultations: 12, remote: 3 },
  { week: 'Mg 2', earnings: 1200, consultations: 18, remote: 5 },
  { week: 'Mg 3', earnings: 980, consultations: 14, remote: 4 },
  { week: 'Mg 4', earnings: 1450, consultations: 22, remote: 7 },
  { week: 'Mg 5', earnings: 1680, consultations: 26, remote: 8 },
  { week: 'Mg 6', earnings: 1920, consultations: 30, remote: 10 },
]

/** Teknisi service breakdown (donut) */
export const teknisiServiceMix = [
  { name: 'Konsultasi Chat', value: 45, color: '#10b981' },
  { name: 'Remote Session', value: 25, color: '#06b6d4' },
  { name: 'Produk Terjual', value: 20, color: '#8b5cf6' },
  { name: 'Joki/Service', value: 10, color: '#f59e0b' },
]

/** Teknisi profile views vs conversion (line) */
export const teknisiConversion = [
  { month: 'Jan', views: 180, consultations: 42, conversion: 23 },
  { month: 'Feb', views: 220, consultations: 56, conversion: 25 },
  { month: 'Mar', views: 195, consultations: 48, conversion: 25 },
  { month: 'Apr', views: 310, consultations: 78, conversion: 25 },
  { month: 'Mei', views: 380, consultations: 102, conversion: 27 },
  { month: 'Jun', views: 420, consultations: 128, conversion: 30 },
]

/** Teknisi rating trend */
export const teknisiRatingTrend = [
  { month: 'Jan', rating: 4.7, reviews: 28 },
  { month: 'Feb', rating: 4.8, reviews: 34 },
  { month: 'Mar', rating: 4.8, reviews: 31 },
  { month: 'Apr', rating: 4.85, reviews: 42 },
  { month: 'Mei', rating: 4.9, reviews: 48 },
  { month: 'Jun', rating: 4.9, reviews: 51 },
]

/* Legacy exports (kept for backward compat if any page still imports them) */
export const deviceTraffic = [
  { name: 'Android', value: 243 },
  { name: 'Windows', value: 200 },
  { name: 'iOS', value: 180 },
  { name: 'Mac', value: 150 },
  { name: 'Linux', value: 120 },
  { name: 'Other', value: 80 },
]

export const locationTraffic = [
  { name: 'Jakarta', value: 180 },
  { name: 'Bandung', value: 120 },
  { name: 'Surabaya', value: 104 },
  { name: 'Medan', value: 85 },
  { name: 'Bali', value: 72 },
  { name: 'Makassar', value: 65 },
]

export const platformGrowth = [
  { month: 'Jan', users: 1200, revenue: 18, consultations: 420 },
  { month: 'Feb', users: 1900, revenue: 28, consultations: 680 },
  { month: 'Mar', users: 1800, revenue: 25, consultations: 610 },
  { month: 'Apr', users: 2500, revenue: 36, consultations: 920 },
  { month: 'Mei', users: 2800, revenue: 44, consultations: 1120 },
  { month: 'Jun', users: 3200, revenue: 52, consultations: 1390 },
]
