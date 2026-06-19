export const SUPPORT_EMAIL = 'hello@bantoo.id'

export const LEGAL_UPDATED_LABEL = 'Juni 2026'

export type LegalPoint = {
  title: string
  body: string
}

export const KETENTUAN_LAYANAN_POINTS: LegalPoint[] = [
  {
    title: 'Akun',
    body: 'Data harus benar; Anda bertanggung jawab atas semua aktivitas di akun Anda.',
  },
  {
    title: 'Layanan',
    body: 'Bantoo memfasilitasi jual-beli, konsultasi, dan layanan digital antara user dan teknisi.',
  },
  {
    title: 'Transaksi',
    body: 'Dana dapat ditahan platform sampai barang atau layanan diterima, atau sengketa diselesaikan admin.',
  },
  {
    title: 'Aturan',
    body: 'Dilarang penipuan dan barang ilegal; Bantoo boleh menangguhkan akun; ketentuan dapat diperbarui sewaktu-waktu.',
  },
]

export const KEBIJAKAN_PRIVASI_POINTS: LegalPoint[] = [
  {
    title: 'Data',
    body: 'Data akun dan transaksi digunakan untuk menjalankan layanan platform.',
  },
  {
    title: 'Penggunaan',
    body: 'Untuk autentikasi, pembayaran, keamanan, dan dukungan pelanggan.',
  },
  {
    title: 'Pembagian',
    body: 'Hanya ke pihak terkait transaksi (payment gateway, lawan transaksi); data tidak dijual.',
  },
  {
    title: 'Hak Anda',
    body: `Akses, koreksi, atau hapus akun via ${SUPPORT_EMAIL}.`,
  },
]

export const KEBIJAKAN_REFUND_POINTS: LegalPoint[] = [
  {
    title: 'Marketplace & rekber',
    body: 'Refund jika order dibatalkan, komplain/retur disetujui, atau mediasi admin.',
  },
  {
    title: 'Layanan',
    body: 'Marketplace, Konsultasi dan Inspeksi: refund hanya jika dibatalkan, komplain, atau gagal karena kesalahan sistem.',
  },
  {
    title: 'Proses',
    body: 'Refund ke saldo wallet Bantoo, kecuali ditentukan lain oleh admin.',
  },
  {
    title: 'Ajukan',
    body: `Email ${SUPPORT_EMAIL} dengan nomor order atau transaksi.`,
  },
]

export const LEGAL_FOOTER_LINKS = [
  { label: 'Ketentuan Layanan', href: '/legal/ketentuan-layanan' },
  { label: 'Kebijakan Privasi', href: '/legal/kebijakan-privasi' },
  { label: 'Kebijakan Refund', href: '/legal/kebijakan-refund' },
  { label: 'Kontak Support', href: '/kontak' },
] as const
