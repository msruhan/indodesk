# Pendapatan Platform — Design Spec

**Tanggal**: 2026-06-17  
**Status**: Approved — v1 implemented  
**Relates to**: `2026-06-16-marketplace-escrow-fees-design.md`, `/admin/keuangan-marketplace`, `/admin/laporan`, `/admin/transactions`

---

## 1. Tujuan

Satu halaman admin **Pendapatan Platform** yang menjawab:

> *Berapa fee yang diperoleh owner/platform dari Marketplace, Rekber, Inspeksi, dan Konsultasi — realisasi vs estimasi — dalam satu tempat.*

Masalah saat ini:

| Layanan | Data fee di DB | Tampilan admin |
|---------|----------------|----------------|
| Marketplace | `buyerFeeAmount` + `sellerFeeAmount` | Hanya di **Keuangan Marketplace** |
| Rekber | `fee` | Per baris di **Transaksi** / kartu Rekber |
| Inspeksi | `platformFee` | Tidak ditampilkan |
| Konsultasi | Tidak ada field fee | Tidak ada; 100% ke teknisi |

**Laporan** menampilkan GMV/volume, bukan pendapatan fee platform.

---

## 2. Ruang lingkup

### In scope (v1)

- Halaman `/admin/pendapatan-platform` dengan ringkasan + breakdown per kanal
- API `GET /api/admin/pendapatan-platform` (agregasi read-only dari tabel existing)
- Aturan **fee terealisasi** vs **fee estimasi (belum final)** per kanal
- Grafik donut mix + tren 7/30 hari per kanal
- Tabel **Riwayat pendapatan terbaru** (gabungan multi-sumber, max 20 baris)
- Link ke **Keuangan Marketplace** (pengaturan % fee marketplace tetap di sana)
- Entri sidebar: **Analitik → Pendapatan Platform**

### Out of scope (v1)

- Wallet sistem / ledger `PLATFORM_FEE` terpusat (deferred v2)
- Pengaturan % fee Rekber / Inspeksi / Konsultasi di UI admin (tetap constant di code)
- Export CSV/PDF
- Refactor penuh **Laporan** atau **Transaksi**

### Phase 2 (dokumentasi, tidak blocking v1)

- Tambah `platformFee` + `teknisiEarning` pada `KonsultasiSession` + potongan saat `COMPLETED`
- Pengaturan `konsultasiFeePercent` di `PlatformSettings`
- Ledger `PLATFORM_FEE` ke wallet platform (audit trail)

---

## 3. Definisi pendapatan per kanal

### 3.1 Marketplace

| Metrik | Query | Kapan dianggap **terealisasi** |
|--------|-------|-------------------------------|
| Fee platform | `buyerFeeAmount + sellerFeeAmount` pada `Order` | `status = COMPLETED` |
| Estimasi | Fee pada order `PAID` / `PROCESSING` / `SHIPPED` | Belum final (bisa refund/komplain) |

Sumber kebenaran: sama dengan `/api/admin/marketplace-finance`.

### 3.2 Rekber

| Metrik | Query | Kapan dianggap **terealisasi** |
|--------|-------|-------------------------------|
| Fee platform | `RekberTransaction.fee` | `status = RELEASED` |
| Estimasi | `fee` pada `HELD`, `PROCESSING`, `SHIPPED` | Dana ditahan, belum release |
| Tidak dihitung | `REFUNDED`, `DISPUTED` (belum release), `PENDING` | — |

**Catatan**: Saat ini `rekberPlatformRevenue` di Transaksi juga menghitung `HELD` sebagai pendapatan — halaman baru memisahkan **Terealisasi** vs **Ditahan**.

### 3.3 Inspeksi

| Metrik | Query | Kapan dianggap **terealisasi** |
|--------|-------|-------------------------------|
| Fee platform | `InspectionOrder.platformFee` | `status = COMPLETED` |
| Estimasi | `platformFee` pada `ACCEPTED`, `IN_PROGRESS`, `REPORT_SUBMITTED` | User belum konfirmasi |
| Tidak dihitung | `CANCELLED`, `REJECTED`, `DISPUTED` (belum resolve), `PAID` (belum diterima) | — |

Fee dihitung saat order dibuat (20% dari `price` di `inspection-pricing.ts`). Teknisi menerima `teknisiEarning`; selisih = pendapatan platform (implicit, belum ledger terpisah).

### 3.4 Konsultasi

| Metrik | v1 | v2 (rencana) |
|--------|-----|--------------|
| Fee platform | **Rp 0** — ditampilkan dengan label *"Belum dikenakan"* | `platformFee` saat `status = COMPLETED` |
| Alasan | `KonsultasiSession` hanya punya `price`; full amount ke teknisi | Tambah field + split di `finalizeKonsultasiPaymentToTeknisi` |

v1 tetap menampilkan kartu Konsultasi (count sesi selesai, GMV `price`) agar admin sadar volume, dengan badge bahwa fee belum aktif.

---

## 4. Pendekatan teknis

### Opsi yang dipertimbangkan

| Opsi | Pro | Kontra |
|------|-----|--------|
| **A. Agregasi query** (rekomendasi v1) | Cepat, tanpa migrasi, konsisten dengan Keuangan Marketplace | Tidak ada audit ledger tunggal |
| B. Tabel `PlatformRevenueEvent` | Riwayat immutable, query cepat | Migrasi + backfill + write path di setiap settlement |
| C. Perluas `/admin/laporan` saja | Satu halaman analitik | Laporan sudah padat; fee vs GMV bercampur |

**Rekomendasi: Opsi A** untuk v1, dengan lib terpusat `src/lib/platform-revenue.ts` agar logic tidak duplikatif dengan `marketplace-finance` dan `transactions`.

### Arsitektur

```
GET /api/admin/pendapatan-platform
        │
        ▼
platform-revenue.ts
  ├── getMarketplaceRevenueStats()
  ├── getRekberRevenueStats()
  ├── getInspectionRevenueStats()
  ├── getKonsultasiRevenueStats()  // v1: zeros + session counts
  └── getRecentPlatformRevenueRows() // union, sort by date
        │
        ▼
AdminPendapatanPlatformView (page)
```

---

## 5. UI — `/admin/pendapatan-platform`

### 5.1 Header

- **Judul**: Pendapatan Platform
- **Subjudul**: Fee owner dari marketplace, rekber, inspeksi, dan konsultasi
- **Aksi**: Refresh, link *"Pengaturan fee marketplace →"* ke `/admin/keuangan-marketplace`

### 5.2 Kartu ringkasan (baris 1)

| Kartu | Nilai | Footnote |
|-------|-------|----------|
| **Total Terealisasi** | Σ fee final semua kanal | Semua waktu |
| **Terealisasi Hari Ini** | Σ fee final hari ini | Per `completedAt` / `releasedAt` |
| **Terealisasi 30 Hari** | Σ fee final 30 hari | — |
| **Estimasi Belum Final** | Σ fee pending (rekber held + inspeksi berjalan + marketplace non-completed) | Bisa berubah |

### 5.3 Kartu per kanal (baris 2 — grid 4 kolom)

Setiap kartu menampilkan:

- **Marketplace** — Terealisasi / Estimasi / jumlah order selesai
- **Rekber** — Terealisasi (`RELEASED`) / Ditahan (`HELD`…`SHIPPED`)
- **Inspeksi** — Terealisasi (`COMPLETED`) / Berjalan
- **Konsultasi** — Badge *Fee belum aktif* + jumlah sesi `COMPLETED` + GMV (informatif)

Warna/ikon selaras dengan **Transaksi** (`ShoppingBag`, `Shield`, `CheckSquare`, `MessageCircle`).

### 5.4 Grafik

1. **Donut — Mix pendapatan terealisasi** (% per kanal, exclude konsultasi jika 0)
2. **Area/Bar — Tren 7 hari** — stacked atau multi-series: marketplace, rekber, inspeksi

### 5.5 Tabel — Riwayat pendapatan terbaru

Kolom: **Tanggal** | **Kanal** | **Referensi** (orderCode) | **Fee** | **Status** (Terealisasi / Estimasi)

Sumber baris:

- Marketplace: order COMPLETED (+ optional 5 order pending dengan fee estimasi)
- Rekber: RELEASED + HELD terbaru
- Inspeksi: COMPLETED + in-progress
- Konsultasi: (kosong di v1, atau baris informatif tanpa fee)

Max 20 baris, sort `occurredAt` desc.

### 5.6 Relasi halaman existing

| Halaman | Peran setelah v1 |
|---------|------------------|
| **Keuangan Marketplace** | Pengaturan % + detail fee marketplace + riwayat order marketplace |
| **Transaksi** | Monitoring operasional semua tipe + kolom pendapatan per baris |
| **Laporan** | Volume/GMV/analitik umum (tidak diubah di v1) |
| **Rekber / Inspeksi admin** | Operasional, bukan agregat keuangan |

**Keputusan navigasi**: Tambah menu **Pendapatan Platform** di atas **Keuangan Marketplace** di sidebar Analitik. Keuangan Marketplace tetap ada (settings + deep dive marketplace).

---

## 6. API response shape (draft)

```ts
type PlatformRevenueChannel = 'marketplace' | 'rekber' | 'inspeksi' | 'konsultasi'

type PlatformRevenueSummary = {
  realized: { total: string; today: string; last30d: string }
  estimated: { total: string } // pending/held
  byChannel: Record<PlatformRevenueChannel, {
    realized: string
    estimated: string
    countRealized: number
    countEstimated: number
    note?: string // e.g. konsultasi fee belum aktif
  }>
  charts: {
    mix: Array<{ channel: PlatformRevenueChannel; label: string; amount: string; color: string }>
    daily: {
      labels: string[]
      marketplace: number[]
      rekber: number[]
      inspeksi: number[]
    }
  }
  recent: Array<{
    id: string
    channel: PlatformRevenueChannel
    orderCode: string
    fee: string
    phase: 'realized' | 'estimated'
    occurredAt: string
    href: string // deep link admin jika ada
  }>
}
```

---

## 7. File yang akan dibuat/diubah (implementasi)

| File | Aksi |
|------|------|
| `src/lib/platform-revenue.ts` | **Baru** — agregasi & helpers |
| `src/app/api/admin/pendapatan-platform/route.ts` | **Baru** |
| `src/components/admin/admin-pendapatan-platform-view.tsx` | **Baru** |
| `src/app/admin/pendapatan-platform/page.tsx` | **Baru** |
| `src/components/dashboard/admin-sidebar.tsx` | Tambah menu |
| `src/lib/dashboard-smart-search.ts` | Quick action |
| `src/proxy.ts` | Protect route |
| `src/app/api/admin/marketplace-finance/route.ts` | Opsional: reuse helper dari `platform-revenue` |

---

## 8. Edge cases

| Kasus | Perilaku |
|-------|----------|
| Order marketplace REFUNDED setelah COMPLETED | Fee terealisasi tetap di history; tidak ada clawback otomatis di v1 |
| Rekber DISPUTED → REFUNDED | Fee tidak masuk terealisasi |
| Inspeksi DISPUTED → refund | `platformFee` tidak terealisasi |
| Timezone | Gunakan `Asia/Jakarta` untuk "hari ini" (konsisten dengan dashboard period) |
| DB kosong | Kartu 0, empty state tabel, donut "Belum ada data" |

---

## 9. Testing (manual)

1. Seed / data existing — total terealisasi marketplace = angka di Keuangan Marketplace
2. Rekber RELEASED — fee muncul di kanal Rekber terealisasi
3. Rekber HELD — masuk estimasi, bukan terealisasi
4. Inspeksi COMPLETED — `platformFee` masuk terealisasi
5. Konsultasi COMPLETED — kartu tampil count, fee = 0 + note
6. Refresh + filter periode (opsional v1.1: `DashboardMonthFilter`)

---

## 10. Roadmap

| Fase | Isi |
|------|-----|
| **v1** | Halaman + API agregasi (dokumen ini) |
| **v1.1** | Filter bulan + redirect dari Keuangan Marketplace header |
| **v2** | Fee konsultasi + platform settings |
| **v3** | Ledger `PLATFORM_FEE` + rekonsiliasi otomatis |

---

## 11. Rekomendasi produk

Pendapatan Platform menjadi **single source of truth** untuk owner melihat fee. **Keuangan Marketplace** tetap untuk konfigurasi & audit marketplace. Hindari menghapus Keuangan Marketplace — admin marketplace ops butuh halaman fokus.

Setuju dengan desain ini? Setelah approve, lanjut implementasi v1.
